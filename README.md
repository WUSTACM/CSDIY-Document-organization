# WUSTACM - CSDIY - Docs

本项目是 WUSTACM 维护的计算机科学开源知识库。基于 VitePress 构建，采用全自动化路由引擎，支持百篇级文档的高效归档与检索。

为确保知识库的极高信息密度与架构稳定性，所有参与贡献的开发者请严格遵守以下协作协议。

---

## ⚡ 核心架构与写作规范

### 不要修改任何配置文件，只写文章就行

### **如果写的文章所属的课程已经有了文件夹，那就新增文章就行**

### **如果没有就必须新建一个文件夹，哪怕你只写了一篇文章**



### 1. 新增文章

在任何现有模块文件夹中新建 `.md` 文件时，**文件最顶部必须强制包含以下 YAML 元数据**：

```yaml
---
title: 您的文章标题（将显示在侧边栏）
order: 10
---

# 您的正文标题...
```

- **排版引擎说明**：`order` 决定该文章在文件夹的上下顺序。数字越小越靠前。为预留后续插入空间，请使用 `1, 2, 3, 4` 这样的。

### 2. 新建文件夹

如果您要创建一个新的文件夹，为了让侧边栏能正确识别该分类的名称，您**必须**在该文件夹下创建一个 `index.md` 文件：

```YAML
---
title: 数据库系统原理（将显示在侧边栏）
order: 40
---
# 这里是数据库模块的引导页。
```

- **排版引擎说明**：文件夹之间按照`order` 排序。数字越小越靠前。为预留后续插入空间，请使用 `1, 2, 3, 4` 这样的。

  





## 🔄 标准贡献工作流 (PR Mode)

本仓库处于强校验保护状态，主分支禁止直接 Push。所有内容贡献必须通过 Pull Request (PR) 机制流转。

### Step 1: 派生仓库 (Fork)

1. 点击本仓库右上角的 **Fork** 按钮。
2. 将仓库派生到您个人的 GitHub 账号下。

### Step 2: 克隆与分支隔离

将您的个人派生仓库克隆到本地：

Bash

```
git clone [https://github.com/您的用户名/CSDIY-Document-organization.git](https://github.com/您的用户名/CSDIY-Document-organization.git)
cd CSDIY-Document-organization
```

### Step 3: 本地创作与实时预览

在 `docs/` 目录下进行 Markdown 创作。启动本地热更新服务器实时校验您的排版：

Bash

```
npm install
npm run docs:dev
```

在浏览器打开 `http://localhost:5173` 预览效果，确认无死链且样式正常。

### Step 4: 提交与推送 (Commit & Push)

Bash

```
git add .
git commit -m "docs: 新增 XXX 知识点解析"
git push origin main
```

### Step 5: 发起拉取请求 (Pull Request)

1. 回到您个人 GitHub 账号下的仓库页面，会看到一个 **Compare & pull request** 提示。
2. 点击它，简单描述您新增的文档内容，提交 PR。
3. 等待主仓库管理员（Maintainers）进行 Code Review。审核通过后，您的文章将被合并入主干并由 Actions 自动化全球部署。