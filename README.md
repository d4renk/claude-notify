# Claude Notify

为 Claude Code 提供智能任务完成通知的 Hook 工具。

## 功能特性

- **智能推送**：仅在长耗时任务（默认 180 秒）完成时推送通知
- **多场景监听**：
  - 用户输入（UserPromptSubmit）- 记录任务开始
  - 需要确认（Notification）- 等待用户操作时提醒
  - 任务完成（Stop）- 自动检测成功/失败状态
  - 上下文压缩（PreCompact）- 长任务警告
- **多平台支持**：支持 20+ 推送服务（Bark、Server 酱、Telegram、钉钉、飞书等）
- **自动状态检测**：智能识别任务成功/失败/结束状态

## 快速开始

### 前置要求

- Linux 系统（WSL2 亦可）
- Node.js 14+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd claude-notify
   ```

2. **运行安装脚本**
   ```bash
   bash install.sh
   ```

3. **配置环境变量**

   在您的 shell 配置文件（如 `~/.bashrc` 或 `~/.zshrc`）中添加：
   ```bash
   # Claude Notify 配置
   export CLAUDE_NOTIFY_LONG_TASK_SECONDS=180
   export CLAUDE_NOTIFY_STATE_DIR=~/.claude/claude-notify-state
   export CLAUDE_NOTIFY_TITLE_PREFIX="Claude Code"

   # 推送服务配置（选择您需要的服务）
   export BARK_PUSH=https://api.day.app/YOUR_KEY
   # export PUSH_KEY=YOUR_SERVER_CHAN_KEY
   # ... 其他推送服务配置
   ```

4. **重新加载配置并测试**
   ```bash
   # 加载环境变量
   source ~/.bashrc  # 或 source ~/.zshrc

   # 测试推送
   node send-notify.js "测试" "这是一条测试消息"
   ```

## 配置说明

### 环境变量分类

#### 📌 基础配置（可选，有默认值）

这些配置项都有默认值，可以不设置：

```bash
# 长任务阈值（秒），默认 180
export CLAUDE_NOTIFY_LONG_TASK_SECONDS=180

# 状态文件存储目录，默认 ~/.claude/claude-notify-state
export CLAUDE_NOTIFY_STATE_DIR=~/.claude/claude-notify-state

# 通知标题前缀，默认 "Claude Code"
export CLAUDE_NOTIFY_TITLE_PREFIX="Claude Code"

# 是否启用一言（随机句子），默认 false
export HITOKOTO=false

# Debug 模式（启用后记录详细日志到 hook.log），默认 false
export CLAUDE_NOTIFY_DEBUG=false
```

#### 🔔 推送服务配置（必选其一）

**至少配置一个推送服务**，否则无法接收通知。以下按推荐度排序：

##### 推荐服务（配置简单）

```bash
# 1. Bark (iOS 推荐) - 只需一个变量
export BARK_PUSH=https://api.day.app/YOUR_KEY

# 2. Server 酱 (微信推荐) - 只需一个变量
export PUSH_KEY=YOUR_SERVER_CHAN_KEY

# 3. Telegram - 需要两个变量
export TG_BOT_TOKEN=YOUR_BOT_TOKEN
export TG_USER_ID=YOUR_USER_ID

# 4. 钉钉机器人 - 需要两个变量
export DD_BOT_TOKEN=YOUR_TOKEN
export DD_BOT_SECRET=YOUR_SECRET

# 5. 飞书机器人 - 只需一个变量
export FSKEY=YOUR_KEY
```

##### 其他支持的服务

<details>
<summary>点击展开查看完整列表</summary>

| 服务名称 | 必需变量 | 可选变量 |
|---------|---------|---------|
| **Bark (iOS)** | `BARK_PUSH` | `BARK_ICON`, `BARK_SOUND`, `BARK_GROUP`, `BARK_LEVEL`, `BARK_ARCHIVE`, `BARK_URL` |
| **Server 酱** | `PUSH_KEY` | - |
| **PushDeer** | `DEER_KEY` | `DEER_URL` |
| **PushPlus** | `PUSH_PLUS_TOKEN` | `PUSH_PLUS_USER`, `PUSH_PLUS_TEMPLATE`, `PUSH_PLUS_CHANNEL`, `PUSH_PLUS_WEBHOOK`, `PUSH_PLUS_CALLBACKURL`, `PUSH_PLUS_TO` |
| **企业微信机器人** | `QYWX_KEY` | `QYWX_ORIGIN` |
| **企业微信应用** | `QYWX_AM` | - |
| **钉钉机器人** | `DD_BOT_TOKEN`, `DD_BOT_SECRET` | - |
| **飞书机器人** | `FSKEY` | `FSSECRET` |
| **Telegram** | `TG_BOT_TOKEN`, `TG_USER_ID` | `TG_API_HOST`, `TG_PROXY_HOST`, `TG_PROXY_PORT`, `TG_PROXY_AUTH` |
| **WxPusher** | `WXPUSHER_APP_TOKEN` | `WXPUSHER_TOPIC_IDS`, `WXPUSHER_UIDS` |
| **Ntfy** | `NTFY_TOPIC` | `NTFY_URL`, `NTFY_PRIORITY`, `NTFY_TOKEN`, `NTFY_USERNAME`, `NTFY_PASSWORD`, `NTFY_ACTIONS` |
| **Gotify** | `GOTIFY_URL`, `GOTIFY_TOKEN` | `GOTIFY_PRIORITY` |
| **iGot** | `IGOT_PUSH_KEY` | - |
| **QQ 机器人 (go-cqhttp)** | `GOBOT_URL`, `GOBOT_QQ` | `GOBOT_TOKEN` |
| **QQ 机器人 (Chronocat)** | `CHRONOCAT_URL`, `CHRONOCAT_QQ` | `CHRONOCAT_TOKEN` |
| **微加机器人** | `WE_PLUS_BOT_TOKEN`, `WE_PLUS_BOT_RECEIVER` | `WE_PLUS_BOT_VERSION` |
| **Qmsg 酱** | `QMSG_KEY` | `QMSG_TYPE` |
| **智能微秘书** | `AIBOTK_KEY` | `AIBOTK_TYPE`, `AIBOTK_NAME` |
| **PushMe** | `PUSHME_KEY` | `PUSHME_URL` |
| **Chat (Synology)** | `CHAT_URL`, `CHAT_TOKEN` | - |
| **SMTP 邮件** | `SMTP_SERVER`, `SMTP_EMAIL`, `SMTP_PASSWORD` | `SMTP_SSL`, `SMTP_NAME` |
| **自定义 Webhook** | `WEBHOOK_URL` | `WEBHOOK_METHOD`, `WEBHOOK_CONTENT_TYPE`, `WEBHOOK_BODY`, `WEBHOOK_HEADERS` |

</details>

### 配置示例

#### 最小化配置（推荐）

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加

# 选择一个推送服务（三选一）
export BARK_PUSH=https://api.day.app/YOUR_KEY          # iOS 用户
# export PUSH_KEY=YOUR_KEY                             # 微信用户
# export TG_BOT_TOKEN=xxx; export TG_USER_ID=xxx       # Telegram 用户
```

#### 完整配置示例

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加

# ========================================
# Claude Notify 配置
# ========================================

# 基础配置（可选）
export CLAUDE_NOTIFY_LONG_TASK_SECONDS=180
export CLAUDE_NOTIFY_DEBUG=false
export HITOKOTO=false

# 推送服务（必选其一）
export BARK_PUSH=https://api.day.app/YOUR_KEY
export BARK_GROUP=Claude
export BARK_SOUND=bell
```

### 获取推送服务密钥

- **Bark**: [App Store 下载](https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865) → 打开获取 Key
- **Server 酱**: [https://sct.ftqq.com](https://sct.ftqq.com) → 登录获取 SendKey
- **Telegram**: [@BotFather](https://t.me/botfather) 创建机器人 → 获取 Token 和 User ID
- **钉钉**: 群设置 → 智能群助手 → 添加机器人 → 自定义机器人
- **飞书**: [开放平台](https://open.feishu.cn) → 创建机器人 → 获取 Webhook

更多服务配置请参考 `.env.example` 文件。

## 工作原理

```
用户输入 → 记录开始时间
    ↓
任务执行中...
    ↓
触发事件（需要确认/任务完成/上下文压缩）
    ↓
判断：是否超过阈值（默认 180 秒）？
    ├─ 否 → 静默跳过
    └─ 是 → 推送通知
```

## 卸载

```bash
bash uninstall.sh
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `install.sh` | 自动安装脚本 |
| `uninstall.sh` | 卸载脚本 |
| `claude_notify_hook.js` | 核心 Hook 处理逻辑 |
| `notify.js` | 推送服务封装 |
| `send-notify.js` | 手动推送测试工具 |

## 注意事项

1. **配置环境变量**：所有配置通过 shell 环境变量设置（如 ~/.bashrc）
2. 推送服务需要自行注册并获取 Token/Key
3. Hook 配置文件位于 `~/.claude/settings.json`
4. 状态文件存储于 `~/.claude/claude-notify-state/`

## 许可证

MIT

## 相关文档

- [Claude Code Hooks 完整指南](./Claude%20Code%20Hooks%20完整指南.md)
- [CHANGELOG](./CHANGELOG.md)
