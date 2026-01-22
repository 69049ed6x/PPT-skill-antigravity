# WPS AI 样式助手 - WPS 原生插件加载指南

## 🎯 加载方式

### 方法 1: 使用 wpsjs 命令（推荐）

```bash
cd C:\Users\24512\OneDrive\文档\wps-ai-stylist\wps-native
wpsjs debug
```

这个命令会：
1. 自动启动 WPS Writer
2. 加载插件进行调试
3. 启动本地 HTTP 服务

### 方法 2: 手动发布到 WPS

```bash
cd C:\Users\24512\OneDrive\文档\wps-ai-stylist\wps-native
wpsjs publish
```

发布后，在 WPS Writer 中：
1. 点击 **工具 → WPS 加载项**
2. 应该能看到 "AI样式助手"
3. 勾选启用

---

## 📋 使用前准备

1. **确保后端服务运行**
   ```bash
   cd C:\Users\24512\OneDrive\文档\wps-ai-stylist\backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **在 WPS 中配置**
   - 打开插件后，展开设置面板
   - 填写智谱 API Key
   - 测试连接

---

## 🔧 调试方法

在 WPS 中按 `Alt + F12` 打开开发者工具，可以查看：
- JavaScript 控制台
- 网络请求
- DOM 结构

---

## 📁 项目文件说明

- `ribbon.xml` - Ribbon UI 配置
- `plugin.json` - 插件元数据
- `index.html` - 主界面
- `wps-integration.js` - WPS API 集成逻辑
