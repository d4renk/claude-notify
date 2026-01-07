#!/usr/bin/env node
/**
 * Claudecli Hook Push - 通知发送脚本
 *
 * 用途: 测试推送功能或手动发送通知
 * 调用方式: node send-notify.js "标题" "内容"
 */

const path = require('node:path');

// 获取同目录下的 notify.js
const notifyPath = path.join(__dirname, 'notify.js');
const { sendNotify } = require(notifyPath);

// 从命令行参数获取标题和内容
const title = process.argv[2] || 'Claude Code';
const content = process.argv[3] || '';

if (!content) {
  console.log('使用方法: node send-notify.js "标题" "内容"');
  process.exit(1);
}

// 发送通知
sendNotify(title, content)
  .then((result) => {
    if (result && result.summary) {
      const { success, failed, skipped, unknown } = result.summary;
      console.log(
        `推送结果: 成功 ${success} 失败 ${failed} 跳过 ${skipped} 未知 ${unknown}`
      );
      const hardFail = failed > 0 && success === 0;
      process.exit(hardFail ? 1 : 0);
      return;
    }
    console.log('✓ 推送发送成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ 推送发送失败:', error.message);
    process.exit(1);
  });
