#!/usr/bin/env node
/**
 * Claudecli Hook Push - Node.js 版本
 * 监听 Claude Code Hook 事件，自动推送长耗时任务的状态通知
 *
 * 支持的 Hook 事件:
 * - UserPromptSubmit: 记录任务开始
 * - Notification: 需要用户操作时推送
 * - Stop: 任务完成/失败时推送
 * - PreCompact: 上下文压缩时推送（长任务警告）
 */

const fs = require('node:fs');
const path = require('node:path');
const { sendNotify } = require(path.join(__dirname, 'notify.js'));

// ========================================
// 配置加载（从环境变量）
// ========================================

// 配置参数
const DEFAULT_LONG_SECONDS = 180;
const LONG_TASK_SECONDS = parseInt(
  process.env.CLAUDECLI_LONG_TASK_SECONDS || DEFAULT_LONG_SECONDS,
  10
);
const STATE_DIR = path.resolve(
  process.env.CLAUDECLI_STATE_DIR?.replace('~', process.env.HOME) ||
    path.join(process.env.HOME, '.claude', 'claudecli-hook-state')
);
const TITLE_PREFIX = process.env.CLAUDECLI_NOTIFY_TITLE_PREFIX || 'Claude Code';
const LOG_FILE = path.join(STATE_DIR, 'hook.log');

// 确保状态目录存在
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logMessage, 'utf-8');
  } catch (error) {
    // 忽略日志写入错误
  }
}

// ========================================
// 工具函数
// ========================================

/**
 * 从 stdin 读取 Hook 输入数据
 */
async function loadHookInput() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      try {
        const data = Buffer.concat(chunks).toString('utf-8');
        resolve(JSON.parse(data));
      } catch (error) {
        resolve({});
      }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

/**
 * 获取会话状态文件路径
 */
function getStateFile(sessionId) {
  return path.join(STATE_DIR, `${sessionId}.json`);
}

/**
 * 读取会话状态
 */
function readState(sessionId) {
  const stateFile = getStateFile(sessionId);
  if (!fs.existsSync(stateFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(stateFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * 写入会话状态
 */
function writeState(sessionId, data) {
  const stateFile = getStateFile(sessionId);
  try {
    fs.writeFileSync(stateFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Warning: Failed to write state:', error.message);
  }
}

/**
 * 删除会话状态
 */
function deleteState(sessionId) {
  const stateFile = getStateFile(sessionId);
  try {
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  } catch (error) {
    // 忽略错误
  }
}

/**
 * 格式化时长
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }
}

/**
 * 从 transcript 文件检测任务是否失败
 *
 * @returns {boolean|null} true=失败, false=成功, null=无法判断
 */
function detectFailure(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return null;
  }

  try {
    // 读取 transcript 文件的最后部分
    const fd = fs.openSync(transcriptPath, 'r');
    const stats = fs.fstatSync(fd);
    const size = stats.size;

    // 读取最后 64KB 数据
    const bufferSize = Math.min(65536, size);
    const buffer = Buffer.alloc(bufferSize);
    const position = Math.max(0, size - bufferSize);

    fs.readSync(fd, buffer, 0, bufferSize, position);
    fs.closeSync(fd);

    const data = buffer.toString('utf-8');

    // 按行解析 JSONL
    const lines = data
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    const recentLines = lines.slice(-100); // 最近100行

    // 检测失败模式
    for (let i = recentLines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(recentLines[i]);

        // 检查错误标记
        if (obj.is_error === true) {
          return true;
        }
        if (obj.success === false) {
          return true;
        }
        if (obj.error) {
          return true;
        }
        if (obj.type === 'tool_result' && obj.content?.includes('error')) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }

    return false; // 未发现错误，认为成功
  } catch (error) {
    return null; // 无法判断
  }
}

/**
 * 截断文本
 */
function truncateText(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * 检查推送服务配置是否正确
 * @returns {Object} { isConfigured: boolean, services: string[], warnings: string[] }
 */
function checkPushConfig() {
  const result = {
    isConfigured: false,
    services: [],
    warnings: []
  };

  // 检查所有可能的推送服务配置
  const pushServices = {
    'Bark': process.env.BARK_PUSH,
    'Server酱': process.env.PUSH_KEY,
    'PushDeer': process.env.DEER_KEY,
    'PushPlus': process.env.PUSH_PLUS_TOKEN,
    '钉钉': process.env.DD_BOT_TOKEN,
    '企业微信机器人': process.env.QYWX_KEY,
    '企业微信应用': process.env.QYWX_AM,
    '飞书': process.env.FSKEY,
    'Telegram': process.env.TG_BOT_TOKEN && process.env.TG_USER_ID,
    'Gotify': process.env.GOTIFY_URL && process.env.GOTIFY_TOKEN,
    'iGot': process.env.IGOT_PUSH_KEY,
    'QQ机器人(go-cqhttp)': process.env.GOBOT_URL,
    'QQ机器人(Chronocat)': process.env.CHRONOCAT_URL && process.env.CHRONOCAT_TOKEN,
    'Ntfy': process.env.NTFY_TOPIC,
    'WxPusher': process.env.WXPUSHER_APP_TOKEN,
    'Qmsg': process.env.QMSG_KEY && process.env.QMSG_TYPE,
    'PushMe': process.env.PUSHME_KEY,
    'Webhook': process.env.WEBHOOK_URL && process.env.WEBHOOK_METHOD,
    'SMTP': process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_SERVICE,
  };

  // 检查哪些服务已配置
  for (const [name, configured] of Object.entries(pushServices)) {
    if (configured) {
      result.services.push(name);
      result.isConfigured = true;
    }
  }

  // 生成警告信息
  if (!result.isConfigured) {
    result.warnings.push('未检测到任何推送服务配置');
    result.warnings.push('请在环境变量中配置至少一个推送服务（如 DD_BOT_TOKEN、BARK_PUSH 等）');
  }

  // 检查状态目录
  if (!fs.existsSync(STATE_DIR)) {
    result.warnings.push(`状态目录不存在: ${STATE_DIR}`);
  }

  return result;
}

// ========================================
// Hook 事件处理器
// ========================================

/**
 * 处理 UserPromptSubmit 事件 - 记录任务开始
 */
function handleUserPromptSubmit(payload) {
  const sessionId = payload.session_id;
  if (!sessionId) {
    return;
  }

  // 检查推送配置
  const configCheck = checkPushConfig();

  // 记录配置检查结果到日志
  if (configCheck.warnings.length > 0) {
    log('⚠️  配置警告:');
    configCheck.warnings.forEach(warning => {
      log(`  - ${warning}`);
    });
  } else if (configCheck.isConfigured) {
    log(`✓ 已启用推送服务: ${configCheck.services.join(', ')}`);
    log(`✓ 长任务阈值: ${LONG_TASK_SECONDS}秒`);
  }

  const state = {
    started_at: Date.now() / 1000,
    prompt: payload.prompt || '',
    cwd: payload.cwd || '',
    notified_user_action: false,
    notified_compact: false,
  };

  writeState(sessionId, state);
  log(`会话开始: ${sessionId} - ${truncateText(state.prompt, 50)}`);
}

/**
 * 处理 Notification 事件 - 需要用户操作
 */
async function handleNotification(payload) {
  const sessionId = payload.session_id;
  if (!sessionId) {
    return;
  }

  const state = readState(sessionId);
  if (!state) {
    return;
  }

  // 计算耗时
  const now = Date.now() / 1000;
  const elapsed = now - state.started_at;

  // 只在超过阈值且未通知过时推送
  if (elapsed < LONG_TASK_SECONDS) {
    return;
  }

  if (state.notified_user_action) {
    return;
  }

  // 提取通知消息
  const message = payload.message || 'Claude needs your input';

  // 构建通知内容
  const title = `${TITLE_PREFIX} 🔔 需要确认`;
  const content = `📋 **消息**: ${message}

⏱️ **已耗时**: ${formatDuration(elapsed)}

💡 **提示**: ${truncateText(state.prompt, 100)}

📁 **目录**: ${state.cwd}
`;

  await sendNotify(title, content);

  // 标记已通知
  state.notified_user_action = true;
  writeState(sessionId, state);
}

/**
 * 处理 Stop 事件 - 任务完成或失败
 */
async function handleStop(payload) {
  const sessionId = payload.session_id;
  if (!sessionId) {
    return;
  }

  // 检查是否是由 Stop Hook 触发的递归调用
  if (payload.stop_hook_active) {
    return;
  }

  const state = readState(sessionId);
  if (!state) {
    return;
  }

  // 计算耗时
  const now = Date.now() / 1000;
  const elapsed = now - state.started_at;

  log(`会话结束: ${sessionId} - 耗时: ${formatDuration(elapsed)}`);

  // 只在超过阈值时推送
  if (elapsed < LONG_TASK_SECONDS) {
    log(`耗时未达阈值 (${LONG_TASK_SECONDS}秒)，跳过推送`);
    deleteState(sessionId);
    return;
  }

  // 检测任务状态
  const transcriptPath = payload.transcript_path || '';
  const failed = detectFailure(transcriptPath);

  let status, emoji;
  if (failed === true) {
    status = '❌ 失败';
    emoji = '💔';
  } else if (failed === false) {
    status = '✅ 完成';
    emoji = '🎉';
  } else {
    status = '⏹️ 结束';
    emoji = '📊';
  }

  log(`任务状态: ${status} - 准备推送通知`);

  // 构建通知内容
  const title = `${TITLE_PREFIX} ${emoji} 任务${status}`;
  const content = `⏱️ **总耗时**: ${formatDuration(elapsed)}

💡 **任务**: ${truncateText(state.prompt, 100)}

📁 **目录**: ${state.cwd}

🕐 **完成时间**: ${new Date().toLocaleString('zh-CN', { hour12: false })}
`;

  await sendNotify(title, content);
  log(`通知已发送: ${title}`);

  // 清理状态
  deleteState(sessionId);
}

/**
 * 处理 PreCompact 事件 - 上下文压缩警告
 */
async function handlePreCompact(payload) {
  const sessionId = payload.session_id;
  if (!sessionId) {
    return;
  }

  const state = readState(sessionId);
  if (!state) {
    return;
  }

  // 避免重复通知
  if (state.notified_compact) {
    return;
  }

  // 计算耗时
  const now = Date.now() / 1000;
  const elapsed = now - state.started_at;

  // 获取压缩触发方式
  const trigger = payload.trigger || 'auto';
  const triggerText = trigger === 'manual' ? '用户手动触发' : '上下文已满自动触发';

  // 构建通知内容
  const title = `${TITLE_PREFIX} 📦 上下文压缩`;
  const content = `⚠️ **警告**: 任务进入长时间运行状态

⏱️ **已耗时**: ${formatDuration(elapsed)}

🔄 **压缩方式**: ${triggerText}

💡 **任务**: ${truncateText(state.prompt, 100)}

📁 **目录**: ${state.cwd}

💬 **说明**: Claude 正在压缩对话上下文以继续工作
`;

  await sendNotify(title, content);

  // 标记已通知
  state.notified_compact = true;
  writeState(sessionId, state);
}

// ========================================
// 主入口
// ========================================

async function main() {
  try {
    // 读取 Hook 输入
    const payload = await loadHookInput();

    if (!payload || !payload.hook_event_name) {
      return;
    }

    // 获取事件类型
    const eventName = payload.hook_event_name;

    // 根据事件类型分发处理
    const handlers = {
      UserPromptSubmit: handleUserPromptSubmit,
      Notification: handleNotification,
      Stop: handleStop,
      PreCompact: handlePreCompact,
    };

    const handler = handlers[eventName];
    if (handler) {
      await handler(payload);
    }
  } catch (error) {
    console.error('Hook execution error:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
