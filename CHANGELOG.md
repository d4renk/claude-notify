# 更新日志

## v1.2.0 - 2025-01-07

### 🔧 优化
- **环境变量优先**：移除 .env 文件加载机制，直接从环境变量读取配置
- 推荐使用 `.env` 管理环境变量配置
- 更新文档说明，引导用户使用 `source .env` 加载配置

### 📝 变更
- **平台定位**：明确项目定向为 Linux 系统专用
- **项目结构简化**：移除 hooks/ 和 scripts/ 子目录，所有文件置于根目录
- **Git 白名单模式**：.gitignore 改为白名单模式，默认忽略所有文件
- 移除 `loadEnvFile()` 函数
- 安装脚本改为创建 `.env` 环境变量配置文件
- 统一使用 `.env.example` 作为环境变量配置模板
- 删除 `settings.json.example`，Hook 配置直接内置到 `install.sh` 中
- 增加 WSL2 和 macOS 兼容性说明

---

## v1.1.0 - 2025-01-07

### ✨ 新功能
- ✅ **纯 Node.js 实现**：移除 Python 依赖，改为纯 Node.js 驱动
- ✅ **自动安装配置**：install.sh 自动配置 Claude Code Hooks 到用户配置
- ✅ **卸载脚本**：添加 uninstall.sh 完整卸载功能

### 🔧 优化
- 优化安装流程，减少用户操作步骤
- 统一使用 Node.js 环境，与 Claude Code 保持一致
- 简化配置文件，移除不必要的驱动选项

### 🗑️ 移除
- 移除 Python 版本的 Hook 脚本
- 移除 CLAUDECLI_NOTIFY_DRIVER 配置项
- 移除 Python 依赖

### 📝 变更
- 默认关闭一言功能（HITOKOTO=false）
- 安装脚本自动配置到 ~/.claude/settings.json
- 更新文档说明为纯 Node.js 版本

---

## v1.0.0 - 2025-01-06

### ✨ 初始版本
- 🔔 监听 4 个 Hook 事件（UserPromptSubmit, Notification, Stop, PreCompact）
- 📱 支持 20+ 推送服务
- ⏱️ 长耗时任务检测
- 📊 智能失败检测
- 💾 会话状态管理
- 📄 完整文档
