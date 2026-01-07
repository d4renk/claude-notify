# Claudecli Hook Push

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
   cd Claudecli-push
   ```

2. **运行安装脚本**
   ```bash
   bash install.sh
   ```

3. **配置推送服务**
   ```bash
   # 编辑环境变量配置文件
   vim .env

   # 填写至少一个推送服务的配置
   # 例如 Bark：
   export BARK_PUSH=https://api.day.app/YOUR_KEY
   ```

4. **加载配置并测试**
   ```bash
   # 加载环境变量
   source .env

   # 测试推送
   node send-notify.js "测试" "这是一条测试消息"
   ```

## 配置说明

### 主要参数

在 `.env` 环境变量配置文件中可配置：

```bash
# 长任务阈值（秒），超过此时间才推送
export CLAUDECLI_LONG_TASK_SECONDS=180

# 状态文件存储目录
export CLAUDECLI_STATE_DIR=~/.claude/claudecli-hook-state

# 通知标题前缀
export CLAUDECLI_NOTIFY_TITLE_PREFIX="Claude Code"
```

### 支持的推送服务

- **iOS**: Bark
- **微信**: Server 酱、PushPlus、企业微信、WxPusher
- **即时通讯**: Telegram、钉钉、飞书、QQ 机器人
- **通用**: Ntfy、Gotify、SMTP 邮件、自定义 Webhook

详见 `.env.example` 查看完整配置选项。

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
| `claudecli_hook_push.js` | 核心 Hook 处理逻辑 |
| `notify.js` | 推送服务封装 |
| `send-notify.js` | 手动推送测试工具 |
| `.env.example` | 环境变量配置模板 |

## 注意事项

1. **首次使用前务必执行** `source .env` 加载环境变量
2. 推送服务需要自行注册并获取 Token/Key
3. Hook 配置文件位于 `~/.claude/settings.json`
4. 状态文件存储于 `~/.claude/claudecli-hook-state/`

## 许可证

MIT

## 相关文档

- [Claude Code Hooks 完整指南](./Claude%20Code%20Hooks%20完整指南.md)
- [CHANGELOG](./CHANGELOG.md)
