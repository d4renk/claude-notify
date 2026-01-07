#!/bin/bash
# Claudecli Hook Push - 快速安装脚本（仅限 Linux）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claudecli Hook Push 安装向导${NC}"
echo -e "${BLUE}  (Linux 系统专用)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查操作系统
echo -e "${YELLOW}[1/5]${NC} 检查操作系统..."
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}✗${NC} 检测到非 Linux 系统: $OSTYPE"
    echo -e "${YELLOW}提示:${NC} 本工具仅支持 Linux 系统"
    echo -e "${YELLOW}建议:${NC}"
    echo -e "  - Windows 用户请使用 WSL2 (Windows Subsystem for Linux)"
    echo -e "  - macOS 用户可尝试运行，但可能需要调整部分脚本"
    echo ""
    read -p "是否继续安装？[y/N]: " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}已取消安装${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✓${NC} Linux 系统检测通过"
fi

# 检查 Node.js（必需）
echo -e "${YELLOW}[2/5]${NC} 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} 找到 Node.js $NODE_VERSION"
else
    echo -e "${RED}✗${NC} 未找到 Node.js，请先安装 Node.js 14+"
    echo -e "${YELLOW}提示:${NC} 访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# 创建环境变量配置文件
echo -e "${YELLOW}[3/5]${NC} 创建环境变量配置文件..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo -e "${GREEN}✓${NC} 已创建 .env 环境变量配置文件"
    echo -e "${YELLOW}!${NC} 请编辑 .env 文件配置您的推送服务"
else
    echo -e "${YELLOW}!${NC} .env 文件已存在，跳过"
fi

# 设置执行权限
echo -e "${YELLOW}[4/5]${NC} 设置文件权限..."
chmod +x "$SCRIPT_DIR/claudecli_hook_push.js"
chmod +x "$SCRIPT_DIR/send-notify.js"
echo -e "${GREEN}✓${NC} 权限设置完成"

# 自动配置 Hook
echo -e "${YELLOW}[5/5]${NC} 配置 Claude Code Hooks..."

# 默认安装到用户配置
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$(dirname "$CLAUDE_SETTINGS")"

if [ -f "$CLAUDE_SETTINGS" ]; then
    echo -e "${YELLOW}!${NC} 配置文件已存在，将创建备份"
    cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 直接生成配置内容（注意：使用双引号以便变量展开）
cat > "$CLAUDE_SETTINGS" <<EOF
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$SCRIPT_DIR/claudecli_hook_push.js\"",
            "timeout": 30
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$SCRIPT_DIR/claudecli_hook_push.js\"",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$SCRIPT_DIR/claudecli_hook_push.js\"",
            "timeout": 30
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$SCRIPT_DIR/claudecli_hook_push.js\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
EOF

echo -e "${GREEN}✓${NC} Hook 已自动安装到: $CLAUDE_SETTINGS"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo -e "  1. 编辑环境变量配置文件: ${YELLOW}$SCRIPT_DIR/.env${NC}"
echo -e "  2. 配置至少一个推送服务（如 BARK_PUSH）"
echo -e "  3. 加载环境变量: ${YELLOW}source $SCRIPT_DIR/.env${NC}"
echo -e "  4. 测试推送: ${YELLOW}node $SCRIPT_DIR/send-notify.js \"测试\" \"这是一条测试消息\"${NC}"
echo -e "  5. 启动 Claude Code: ${YELLOW}claude${NC}"
echo ""
echo -e "${BLUE}提示:${NC}"
echo -e "  - 默认阈值为 ${YELLOW}180秒${NC}（3分钟）"
echo -e "  - 可在 .env 中修改 ${YELLOW}CLAUDECLI_LONG_TASK_SECONDS${NC}"
echo -e "  - Hook 配置文件: ${YELLOW}$CLAUDE_SETTINGS${NC}"
echo -e "  - ${YELLOW}重要${NC}: 使用前请先执行 ${YELLOW}source $SCRIPT_DIR/.env${NC}"
echo -e "  - 查看文档: ${YELLOW}$SCRIPT_DIR/README.md${NC}"
echo ""
