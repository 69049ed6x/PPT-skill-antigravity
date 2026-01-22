# WPS AI 样式助手

<div align="center">

![WPS AI Logo](https://img.shields.io/badge/WPS-AI%20Stylist-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**基于智谱 AI 的智能文档润色插件 | 让写作更轻松**

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [使用说明](#-使用说明) • [常见问题](#-常见问题)

</div>

---

## 📖 简介

WPS AI 样式助手是一款专为 WPS Office 设计的智能文档优化插件，利用智谱 AI 的强大能力，帮助您：

- ✨ **智能润色** - 一键优化文字表达
- 🎯 **风格调整** - 轻松切换正式/通俗语气
- 📝 **内容改写** - 快速生成不同版本
- 🔄 **文本精简** - 删减冗余，保留核心

## 🚀 快速开始

### 前置要求

- ✅ Windows 系统
- ✅ WPS Office 11.1.0+
- ✅ 智谱 AI API Key（[免费注册](https://open.bigmodel.cn/)）

**不需要手动安装 Python 和 Node.js** - 安装脚本会自动处理！

### 一键安装

1. **下载项目**
   ```bash
   git clone https://github.com/你的用户名/wps-ai-stylist.git
   cd wps-ai-stylist
   ```

2. **运行安装**
   - 右键 `一键安装.bat` 选择 **"以管理员身份运行"**
   - 等待 3-5 分钟自动完成所有依赖安装

3. **启动插件**
   - 双击 `启动插件.bat`
   - 打开 WPS Writer

4. **配置 API Key**
   - 点击顶部 "AI样式助手" → "打开面板"
   - 点击右下角设置图标
   - 填写智谱 AI API Key 并保存

## ✨ 功能特性

### 核心功能

| 功能 | 说明 | 示例指令 |
|------|------|---------|
| 🎨 智能润色 | 改善文字流畅度和表达质量 | "润色一下" |
| 📏 文本精简 | 删减冗余词句，提炼核心 | "精简这段话" |
| 🎭 风格转换 | 调整语气（正式/通俗/专业） | "改成正式的学术语气" |
| 🔄 内容改写 | 用不同方式表达相同意思 | "重写这段话" |
| 📈 扩展内容 | 增加细节和说明 | "扩展成300字" |

### 技术亮点

- 🤖 **智谱 GLM-4-Flash** - 快速响应，高质量输出
- 🔒 **本地处理** - 数据安全，隐私保护
- ⚡ **即时生效** - 修改后直接更新到文档
- 🎯 **上下文感知** - 理解文档整体风格

## 📖 使用说明

### 基本操作

1. 在文档中**选中要修改的文字**
2. 在右侧面板**输入指令**
3. 点击**发送**，AI 自动完成修改

### 指令示例

```
基础润色：
• "润色一下"
• "检查语法"

风格调整：
• "改成更正式的语气"
• "改成通俗易懂的表达"
• "使用更专业的术语"

内容优化：
• "精简50%"
• "删除冗余词句"
• "扩展成500字"
• "重新组织这段话的逻辑"

特定需求：
• "添加过渡句"
• "使用更多例子"
• "改成疑问句形式"
```

## 🏗️ 项目结构

```
wps-ai-stylist/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI 主程序
│   ├── ai_service.py       # AI 调用逻辑
│   ├── prompt_templates.py # 提示词模板
│   └── requirements.txt    # Python 依赖
├── wps-native/             # WPS 插件
│   ├── index.html          # 面板界面
│   ├── ribbon.xml          # Ribbon 配置
│   ├── wps-integration.js  # WPS API 集成
│   └── styles.css          # 样式文件
├── 一键安装.bat             # 自动安装脚本
├── 启动插件.bat             # 启动脚本
└── README.md               # 说明文档
```

## ❓ 常见问题

<details>
<summary><b>Q: 安装时提示需要管理员权限？</b></summary>

A: 右键点击 `一键安装.bat`，选择"以管理员身份运行"。这是因为需要安装 Python 和 Node.js 到系统目录。
</details>

<details>
<summary><b>Q: WPS 中看不到插件选项卡？</b></summary>

A: 
1. 确保 `启动插件.bat` 正在运行（有两个黑色窗口）
2. 完全关闭 WPS 后重新打开
3. 如果刚安装完软件，建议重启电脑
</details>

<details>
<summary><b>Q: 显示 "Failed to fetch" 错误？</b></summary>

A:
1. 检查两个服务窗口是否都在运行
2. 确认设置中的后端地址是 `http://localhost:8001`
3. 在浏览器访问 http://localhost:8001/health 测试后端
</details>

<details>
<summary><b>Q: AI 返回的还是原文没有修改？</b></summary>

A:
- 使用更明确的指令，如 "精简50%" 而不是 "润色"
- 检查 API Key 是否正确且有剩余额度
- 尝试不同的表述方式
</details>

<details>
<summary><b>Q: 如何获取智谱 AI API Key？</b></summary>

A:
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入控制台 → API Keys → 创建新 Key
4. 新用户通常有免费额度
</details>

## 🛠️ 开发说明

### 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 前端
cd wps-native
wpsjs debug
```

### 技术栈

- **后端**: FastAPI + httpx + 智谱 AI API
- **前端**: WPS JS API + Vanilla JavaScript
- **AI**: 智谱 GLM-4-Flash

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## ⭐ 支持项目

如果这个项目对您有帮助，请给一个 Star ⭐️

---

<div align="center">

**Made with ❤️ for WPS Users**

[报告问题](https://github.com/你的用户名/wps-ai-stylist/issues) • [功能建议](https://github.com/你的用户名/wps-ai-stylist/issues)

</div>
