# WPS AI 样式助手

> 基于智谱 AI 的智能文档润色插件

## 📖 项目简介

WPS AI 样式助手是一款专为 WPS Office 设计的智能文档优化插件，帮助您快速润色和优化文档内容。

## ✨ 核心功能

- 🎨 **智能润色** - 一键优化文字表达
- 📝 **风格调整** - 轻松切换正式/通俗语气
- 🔄 **内容改写** - 快速生成不同版本
- 🎯 **文本精简** - 删减冗余，保留核心

## 🚀 快速开始

### 安装要求

- Windows 系统
- WPS Office 11.1.0+
- Python 3.8+
- Node.js 16+
- 智谱 AI API Key

### 一键安装

```bash
# 克隆项目
git clone https://github.com/69049ed6x/PPT-skill-antigravity.git
cd PPT-skill-antigravity/wps-ai-stylist

# 安装依赖
pip install -r backend/requirements.txt
npm install -g wpsjs

# 启动
.\启动插件.bat
```

### 配置使用

1. 启动服务后打开 WPS Writer
2. 在顶部找到 "AI样式助手" → "打开面板"
3. 点击设置，填写智谱 AI API Key
4. 选中文字，输入指令开始使用

## 📖 使用示例

```plaintext
指令示例：
- "精简这段话"
- "改成更正式的语气"
- "通俗易懂地表达"
- "润色一下"
```

## 🛠️ 技术栈

- **后端**: FastAPI + 智谱 GLM-4-Flash
- **前端**: WPS JS API + Vanilla JavaScript
- **AI**: 智谱 AI API

## 📄 项目结构

```
wps-ai-stylist/
├── backend/           # 后端服务
│   ├── main.py
│   ├── ai_service.py
│   └── requirements.txt
├── wps-native/        # WPS 插件
│   ├── index.html
│   ├── ribbon.xml
│   └── wps-integration.js
└── 启动插件.bat        # 启动脚本
```

## 📞 问题反馈

如遇问题，请提交 [Issue](https://github.com/69049ed6x/PPT-skill-antigravity/issues)

---

**Made with ❤️ for WPS Users**
