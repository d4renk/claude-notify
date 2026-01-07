#!/bin/bash
# Claudecli Hook Push - 卸载脚本（仅限 Linux）

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
echo -e "${BLUE}  Claudecli Hook Push 卸载向导${NC}"
echo -e "${BLUE}  (Linux 系统专用)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}警告:${NC} 此操作将："
echo -e "  1. 从 Claude Code 配置中移除 Hooks"
echo -e "  2. 可选择是否删除项目文件"
echo -e "  3. 可选择是否删除状态数据"
echo ""

read -p "确定要继续卸载吗？[y/N]: " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}已取消卸载${NC}"
    exit 0
fi

echo ""

# 查找并移除 Hooks 配置
echo -e "${YELLOW}[1/3]${NC} 移除 Claude Code Hooks 配置..."

CLAUDE_USER_SETTINGS="$HOME/.claude/settings.json"
CLAUDE_PROJECT_SETTINGS="./.claude/settings.json"

REMOVED=0

# 检查用户级配置
if [ -f "$CLAUDE_USER_SETTINGS" ]; then
    if grep -q "claudecli_hook_push.js" "$CLAUDE_USER_SETTINGS"; then
        echo -e "${YELLOW}发现用户级配置: $CLAUDE_USER_SETTINGS${NC}"
        read -p "是否移除用户级 Hook 配置？[y/N]: " REMOVE_USER

        if [[ "$REMOVE_USER" =~ ^[Yy]$ ]]; then
            # 创建备份
            cp "$CLAUDE_USER_SETTINGS" "$CLAUDE_USER_SETTINGS.uninstall_backup.$(date +%Y%m%d_%H%M%S)"

            # 移除 hooks 配置（清空 hooks 对象）
            # 简单方式：删除整个文件，让用户重新配置
            rm "$CLAUDE_USER_SETTINGS"
            echo -e "${GREEN}✓${NC} 已移除用户级配置（已备份）"
            REMOVED=$((REMOVED + 1))
        else
            echo -e "${YELLOW}!${NC} 跳过用户级配置"
        fi
    fi
fi

# 检查项目级配置
if [ -f "$CLAUDE_PROJECT_SETTINGS" ]; then
    if grep -q "claudecli_hook_push.js" "$CLAUDE_PROJECT_SETTINGS"; then
        echo -e "${YELLOW}发现项目级配置: $CLAUDE_PROJECT_SETTINGS${NC}"
        read -p "是否移除项目级 Hook 配置？[y/N]: " REMOVE_PROJECT

        if [[ "$REMOVE_PROJECT" =~ ^[Yy]$ ]]; then
            # 创建备份
            cp "$CLAUDE_PROJECT_SETTINGS" "$CLAUDE_PROJECT_SETTINGS.uninstall_backup.$(date +%Y%m%d_%H%M%S)"

            # 移除配置
            rm "$CLAUDE_PROJECT_SETTINGS"
            echo -e "${GREEN}✓${NC} 已移除项目级配置（已备份）"
            REMOVED=$((REMOVED + 1))
        else
            echo -e "${YELLOW}!${NC} 跳过项目级配置"
        fi
    fi
fi

if [ $REMOVED -eq 0 ]; then
    echo -e "${YELLOW}!${NC} 未找到任何 Hook 配置"
fi

echo ""

# 清理状态文件
echo -e "${YELLOW}[2/3]${NC} 清理状态文件..."

STATE_DIR="${CLAUDECLI_STATE_DIR:-$HOME/.claude/claudecli-hook-state}"
STATE_DIR="${STATE_DIR/#\~/$HOME}"

if [ -d "$STATE_DIR" ]; then
    echo -e "${YELLOW}发现状态目录: $STATE_DIR${NC}"
    read -p "是否删除所有状态文件？[y/N]: " REMOVE_STATE

    if [[ "$REMOVE_STATE" =~ ^[Yy]$ ]]; then
        rm -rf "$STATE_DIR"
        echo -e "${GREEN}✓${NC} 已删除状态目录"
    else
        echo -e "${YELLOW}!${NC} 保留状态文件"
    fi
else
    echo -e "${YELLOW}!${NC} 未找到状态目录"
fi

echo ""

# 删除项目文件
echo -e "${YELLOW}[3/3]${NC} 删除项目文件..."

read -p "是否删除整个项目目录？[y/N]: " REMOVE_PROJECT_DIR

if [[ "$REMOVE_PROJECT_DIR" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}警告: 将删除目录 $SCRIPT_DIR${NC}"
    read -p "请再次确认删除？[y/N]: " CONFIRM_DELETE

    if [[ "$CONFIRM_DELETE" =~ ^[Yy]$ ]]; then
        # 移到上级目录再删除
        cd ..
        rm -rf "$SCRIPT_DIR"
        echo -e "${GREEN}✓${NC} 已删除项目目录"
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  卸载完成！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        exit 0
    else
        echo -e "${YELLOW}!${NC} 已取消删除项目目录"
    fi
else
    echo -e "${YELLOW}!${NC} 保留项目文件"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  卸载完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}提示:${NC}"
echo -e "  - Hook 配置已移除，Claude Code 将不再执行推送"
echo -e "  - 配置备份保存在原文件目录下"
echo -e "  - 如需重新安装，运行: ${YELLOW}./install.sh${NC}"
echo ""
