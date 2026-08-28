---
title: Markdown 食用指南
order: 5
---

**在此感谢本文主要笔者 25级ACM俱乐部成员 Chord**

# Markdown 的食用指南

想必各位苦于白白的 txt 已久  
想要把纸质版的知识变成电子版保存  
那么使用 Markdown 来记录就是一个不错的选择  
该文章将会讲解 Markdown 的基本用法  
希望对各位有帮助

> Markdown 本质上就是一种“轻量级标记语言”  
> 也就是说，我们不用像 Word 那样到处点按钮，而是用一些简单符号来表示标题、列表、代码块、图片、链接等内容

---

## 标题

```
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

- 效果:

# 一. 一级标题
## 二. 二级标题
### 三. 三级标题

> `#` 的数量越多，标题等级越低  
> 一般来说，一篇文章最好只有一个一级标题，也就是 `# 标题`

---

## 段落

```
这是第一段文字

这是第二段文字
```

- 效果:

这是第一段文字

这是第二段文字

> Markdown 里空一行就会变成新的段落   
> 如果只是普通回车，有些渲染器不会真的换行

---

## 换行

```
第一行  
第二行
```

- 效果:

第一行  
第二行

> 在一行末尾打两个空格，然后再回车，可以实现换行  

```
第一行' '' '
第二行' '' '
```

---

## 加粗，斜体，删除线

```
**文字加粗**
*斜体文字*
***加粗并斜体***
~~删除线~~
```

- 效果:

- **Hello**
- *Hello*
- ***Hello***
- ~~Hello~~

> `***文字***` 可以理解成 `**加粗**` 和 `*斜体*` 的嵌套  
> 删除线常用于表示“这个想法被划掉了，但是保留痕迹”

---

## 引用

### 基础用法

```
> 引用内容
```

- 效果:

> 这是一段引用

> 引用常用于摘录一句话、标记重点、写旁白，或者表示“这段话不是正文主叙述”

### 多行引用

```
> 第一段引用  
> 第二段引用  
> 第三段引用
```

- 效果:

> 第一段引用  
> 第二段引用  
> 第三段引用

> 每一行前面都加上 `>`，就可以形成多行引用  
> 如果想在引用里强制换行，可以在行尾加两个空格

### 嵌套引用

```
> 外层引用
>
> > 内层引用
```

- 效果:

> 外层引用
>
> > 内层引用

> 嵌套引用不算特别常用，但是在整理对话、评论、资料层级时会比较方便

---

## 无序列表

```
- 1
- 2
- 3
```

- 效果:

- 1
- 2
- 3

> 无序列表适合写没有明显先后顺序的内容  
> `-`、`*`、`+` 通常都可以表示无序列表，不过建议一篇文章里统一使用 `-`

### 嵌套无序列表

```
- 前端
  - HTML
  - CSS
  - JavaScript
- 后端
  - Go
  - MySQL
```

- 效果:

- 前端
  - HTML
  - CSS
  - JavaScript
- 后端
  - Go
  - MySQL

> 子列表前面一般缩进两个空格或四个空格  
> 如果发现列表没有嵌套成功，优先检查缩进

---

## 有序列表

```
1. 第一步
2. 第二步
3. 第三步
```

- 效果:

1. 第一步
2. 第二步
3. 第三步

> 有序列表适合写步骤、流程、排名  
> 有些 Markdown 渲染器允许你全部写成 `1.`，它会自动生成编号

```
1. 第一步
1. 第二步
1. 第三步
```

- 效果:

1. 第一步
1. 第二步
1. 第三步

> 这种写法方便后期调整顺序，不用手动改编号

---

## 任务列表

```
- [x] 已完成
- [ ] 未完成
- [ ] 以后再做
```

- 效果:

- [x] 已完成
- [ ] 未完成
- [ ] 以后再做

> `[x]` 表示完成，`[ ]` 表示未完成  
> 这个很适合写学习计划、项目 TODO、文章更新清单

---

## 行内代码

```
使用 `printf()` 输出内容
```

- 效果:

使用 `printf()` 输出内容

> 行内代码适合标记函数名、变量名、命令名、文件名等  
> 比如 `main.go`、`SELECT`、`docker compose up -d`

---

## 代码块

```
(此处为占位括号)``` go
package main

import "fmt"

func main() {
    fmt.Println("Hello Markdown")
}
(此处为占位括号)``` 
```

- 效果:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello Markdown")
}
```

> 代码块适合放多行代码  
> 在开头的三个反引号后面加语言名，可以让代码高亮更准确

### 常见语言标识

```c
```
```cpp
```
```go
```
```java
```
```python
```
```html
```
```css
```
```js
```
```sql
```
```bash
```
```json
```

> 写代码笔记的时候，语言标识最好不要省略  
> 这样渲染出来会更清楚，也更适合以后复习

---

## 链接

```
[显示文字](链接地址)
```

- 示例:

```
[访问 WUST CSDIY 文档站](https://csdiy.wustacm.com/)
```

- 效果:

[访问 WUST CSDIY 文档站](https://csdiy.wustacm.com/)

> `[]` 里面写显示出来的文字，`()` 里面写真正跳转的地址

### 裸链接

```
https://csdiy.wustacm.com/
```

- 效果:

https://csdiy.wustacm.com/

> 有些 Markdown 渲染器会自动把裸链接变成可点击链接  
> 但如果是正式文章，更推荐使用 `[说明文字](链接)` 的写法

---

## 图片

> 已跳转到图片部分 [← 返回“目录与锚点”示例](#目录与锚点)

```
![图片说明](图片地址)
```

- 示例:

```
![千代](../assets/28.jpg)
```

- 效果:

![千代](../assets/28.jpg)

> 图片写法比链接多了一个 `!`  
> `[]` 里面的内容是图片说明，也叫 alt 文本；图片加载失败时会显示它

### 当前目录图片

```
![千代](./qiandai.png)
```

> 如果图片和 Markdown 文件在同一个目录，可以用 `./图片名`

### assets 目录图片

```
![千代](../assets/28.jpg)
```

> 本仓库的文章位于 `docs/tools/`，引用 `docs/assets/` 下的文件时可以写 `../assets/文件名`

---

## 项目 assets 目录的使用

在这个文档项目中，资源文件统一放在 `docs/assets/` 中  
文章位于 `docs/tools/` 时，可以这样引用：

```
../assets/
```

例如：

```
../assets/snowman.png
../assets/blog-cover.jpg
../assets/demo.mp3
../assets/intro.mp4
../assets/report.pdf
```

在 Markdown 中写相对于当前文章的路径即可

> `../assets/` 的 `..` 表示先从 `tools` 目录回到 `docs`，再进入 `assets` 目录

---

## 使用 assets 图片

### 推荐写法

```
![千代](../assets/28.jpg)
```

- 效果:

![千代](../assets/28.jpg)

> 对本仓库中的文章，推荐使用 `../assets/...` 相对路径；本地预览和发布后都能正确找到资源

### 绝对地址写法

```
![图片说明](https://example.com/assets/example.png)
```

> 如果你要把文章复制到别的平台，比如公众号、论坛、其他网站，绝对地址会更稳  
> 但前提是这个图片地址外网可以访问

### 几种路径对比

| 写法 | 示例 | 适合场景 |
|---|---|---|
| 绝对 URL | `https://example.com/assets/a.png` | 跨网站引用 |
| assets 相对路径 | `../assets/a.png` | 本仓库文章推荐 |
| 相对路径 | `./a.png` | 图片和文章在同一目录 |
| 子目录资源 | `../assets/images/a.png` | assets 内按类别整理资源 |

> 对本仓库的文章，最推荐 `../assets/example.png` 这种写法。

---

## 给图片加链接

```
[![wust-csdiy](../assets/28.jpg)](https://csdiy.wustacm.com/)
```

- 效果:

[![wust-csdiy](../assets/28.jpg)](https://csdiy.wustacm.com/)

> 外面是链接，里面是图片   
> 这样点击图片时，就可以跳转到指定页面

---

## 控制图片大小

标准 Markdown 本身不太好控制图片大小，所以可以混用 HTML

```
<img src="../assets/28.jpg" alt="千代" width="300">
```

- 效果:

<img src="../assets/28.jpg" alt="千代" width="300">

> `width="300"` 表示图片宽度为 300 像素

### 按页面宽度缩放

```
<img src="../assets/28.jpg" alt="千代" style="width: 80%;">
```

- 效果:

<img src="../assets/28.jpg" alt="千代" style="width: 80%;">

### 图片居中

```
<div align="center">
  <img src="../assets/28.jpg" alt="千代" width="300">
</div>
```

- 效果:

<div align="center">
  <img src="../assets/28.jpg" alt="千代" width="300">
</div>

> 正式博客里如果需要精细排版，HTML 会比纯 Markdown 灵活

---

## 图片说明文字

如果想让图片下面带一行说明，可以用 HTML 的 `figure`

```
<figure>
  <img src="../assets/28.jpg" alt="千代">
  <figcaption>千代</figcaption>
</figure>
```

- 效果:

<figure>
  <img src="../assets/28.jpg" alt="千代">
  <figcaption>千代</figcaption>
</figure>

> 有些博客主题会自动把 `![图片说明](图片地址)` 里的图片说明渲染出来  
> 但这不是所有主题都支持，所以想稳定显示说明文字，可以用 `figure`

---

## 使用媒体库音频

Markdown 标准语法没有专门的音频写法，所以一般使用 HTML。

```
<audio controls>
  <source src="../assets/29.mp3" type="audio/mpeg">
  你的浏览器不支持 audio 标签
</audio>
```

- 效果:

<audio controls>
  <source src="../assets/29.mp3" type="audio/mpeg">
  你的浏览器不支持 audio 标签
</audio>

> `controls` 表示显示播放按钮、进度条、音量等控制项   
> 如果没有 `controls`，用户可能看不到播放器

### 常见音频类型

| 文件格式 | type 写法 |
|---|---|
| mp3 | `audio/mpeg` |
| wav | `audio/wav` |
| ogg | `audio/ogg` |

---

## 使用媒体库视频

视频也一般使用 HTML

```
<video controls width="720">
  <source src="../assets/30.mp4" type="video/mp4">
  你的浏览器不支持 video 标签
</video>
```

- 效果:

<video controls width="720">
  <source src="../assets/30.mp4" type="video/mp4">
  你的浏览器不支持 video 标签
</video>

### 自适应宽度视频

```
<video controls style="width: 100%; max-width: 900px;">
  <source src="../assets/30.mp4" type="video/mp4">
</video>
```

- 效果:

<video controls style="width: 100%; max-width: 900px;">
  <source src="../assets/30.mp4" type="video/mp4">
</video>

### 给视频加封面

```
<video controls poster="../assets/28.jpg" style="width: 100%; max-width: 900px;">
  <source src="../assets/30.mp4" type="video/mp4">
</video>
```

- 效果:

<video controls poster="../assets/28.jpg" style="width: 100%; max-width: 900px;">
  <source src="../assets/30.mp4" type="video/mp4">
</video>

> `poster` 表示视频未播放前显示的封面图  
> 博客文章里放视频时，建议加封面，不然页面可能看起来比较空

---

## 文件下载链接

如果媒体库里有 PDF、压缩包、文档，可以直接当链接使用

```
[下载 千代图](../assets/28.jpg)
```

- 效果:

[下载 千代图](../assets/28.jpg)

> 文件能不能下载，取决于服务器是否允许访问这个路径  
> 如果点击后是 404，说明路径写错了，或者服务器没有把这个目录开放出来

---

## 表格

```
| 名称 | 类型 | 说明 |
|---|---|---|
| Go | 编程语言 | 适合后端 |
| MySQL | 数据库 | 存储数据 |
| Linux | 操作系统 | 服务器常用 |
```

- 效果:

| 名称 | 类型 | 说明 |
|---|---|---|
| Go | 编程语言 | 适合后端 |
| MySQL | 数据库 | 存储数据 |
| Linux | 操作系统 | 服务器常用 |

> 表格第一行是表头  
> 第二行的 `---` 用来分隔表头和内容

### 表格对齐

```
| 左对齐 | 居中 | 右对齐 |
|:---|:---:|---:|
| A | B | C |
```

- 效果:

| 左对齐 | 居中 | 右对齐 |
|:---|:---:|---:|
| A | B | C |

> `:---` 表示左对齐  
> `:---:` 表示居中  
> `---:` 表示右对齐

---

## 分割线

```
---
```

- 效果:

---

也可以这样写：

```
***
```

- 效果:

***

> 分割线适合用来隔开文章的大段内容  
> 但不要用太多，不然文章会显得很碎

---

## 转义字符

如果想让 Markdown 符号正常显示，而不是被当成语法，可以在前面加反斜杠 `\`

```
\# 这不是标题
\* 这不是列表
\> 这不是引用
```

- 效果:

\# 这不是标题  
\* 这不是列表  
\> 这不是引用

> 这就叫转义  
> 当你想展示 Markdown 语法本身时，经常会用到

---

## HTML 混写

Markdown 里通常可以直接写一部分 HTML

### 换行

```
<br>
```

### 居中

```
<div align="center">
  居中的文字
</div>
```

- 效果:

<div align="center">
  居中的文字
</div>

### 折叠内容

```
<details>
  <summary>点击展开</summary>

这里是隐藏内容

</details>
```

- 效果:

<details>
  <summary>点击展开</summary>

这里是隐藏内容

</details>

> HTML 混写可以补足 Markdown 的排版能力  
> 但不同平台支持程度不一样，个人博客通常支持得更好

---

## 脚注

有些 Markdown 渲染器支持脚注

```
这是一个带脚注的句子[^1]

[^1]: 这里是脚注内容
```

- 效果:

> 当前文档站未启用脚注插件，因此这里仅展示其写法；使用前请确认目标 Markdown 渲染器支持脚注

> 脚注适合补充资料来源、额外说明、吐槽  
> 不过不是所有 Markdown 平台都支持脚注

---

## 目录与锚点

很多博客系统会根据标题自动生成锚点

比如有一个标题：

```
## 图片
```

那么可能可以这样跳转：

```
[跳转到图片部分](#图片)
```

- 效果:

[跳转到图片部分](#图片)

> 不同渲染器生成锚点的规则可能不完全一样  
> 中文标题一般也能用，但如果跳转失败，可以试着把标题改成英文

---

## Front Matter

如果你使用的是 Hugo、Hexo、Jekyll 这类博客系统，文章开头经常会出现 Front Matter

```
---
title: "我的第一篇博客"
date: 2026-05-12
draft: false
tags:
  - Markdown
  - 博客
categories:
  - 技术笔记
cover: "../assets/markdown-cover.jpg"
---
```

> Front Matter 可以理解为文章的“基础信息”  
> 比如标题、日期、标签、分类、封面图等

常见字段：

```
title: "文章标题"
date: 2026-05-12
draft: false
tags:
  - 标签1
  - 标签2
categories:
  - 分类名
cover: "../assets/cover.jpg"
```

> `cover` 可以使用 assets 中的图片路径   
> 比如 `../assets/cover.jpg`

---

## 博客文章常用模板

````md
---
title: "文章标题"
date: 2026-05-12
draft: false
tags:
  - Markdown
categories:
  - 技术笔记
cover: "../assets/example-cover.jpg"
---

# 文章标题

> 这里可以写一句摘要或者引言

## 前言

这里写为什么要写这篇文章

## 正文

这里写主要内容

可以插入图片：

![配图说明](../assets/example.png)

可以插入代码：

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello Blog")
}
```

## 总结

最后总结一下这篇文章讲了什么
````

> 这个模板适合技术笔记、学习总结、项目记录  
> 如果只是随笔，可以不用写得这么完整

---

## assets 文件命名建议

推荐这样命名：

```
../assets/qiandai-avatar.png
../assets/subnautica-2-cover.jpg
../assets/bgm-demo.mp3
../assets/blog-intro.mp4
../assets/report.pdf
```

不太推荐这样命名：

```
../assets/图片 1.png
../assets/新建文件夹/我的图片最终最终版.png
../assets/啊啊啊.png
```

> 文件名最好使用英文、小写、短横线  
> 不建议使用空格、特殊符号、过长中文名  
> 这样路径更稳定，也更不容易出现奇怪的访问问题

推荐规则：

```
英文
小写
短横线 -
不要空格
尽量不要中文路径
```

例如：

```
snowman-avatar.png
blog-cover-2026.jpg
markdown-note-cover.png
```

---

## 最常用的一组写法

如果只记一小部分，先记这些就够了。

```
# 一级标题
## 二级标题
### 三级标题

**加粗**
*斜体*
~~删除线~~

> 引用内容

- 无序列表
- 无序列表

1. 有序列表
2. 有序列表

- [x] 已完成
- [ ] 未完成

`行内代码`

```go
fmt.Println("Hello")
```

[访问 WUST CSDIY 文档站](https://csdiy.wustacm.com/)

![千代](../assets/28.jpg)

---

| 表头1 | 表头2 |
|---|---|
| 内容1 | 内容2 |

---

## assets 最常用的一组写法

### 图片

```
![图片说明](../assets/example.png)
```

### 控制图片大小

```
<img src="../assets/example.png" alt="图片说明" width="500">
```

### 音频

```
<audio controls>
  <source src="../assets/example.mp3" type="audio/mpeg">
</audio>
```

### 视频

```
<video controls style="width: 100%; max-width: 900px;">
  <source src="../assets/example.mp4" type="video/mp4">
</video>
```

### 文件下载

```
[下载文件](../assets/example.pdf)
```

> 简单来说：  
> 本仓库的资源放入 `docs/assets/` 后，`docs/tools/` 中的文章可通过 `../assets/...` 引用  
> 图片用 Markdown 语法，音频和视频一般用 HTML 标签

---

## 最后总结

Markdown 的核心其实不复杂：

- `#` 用来写标题
- `**文字**` 用来加粗
- `>` 用来引用
- `-` 用来写列表
- `代码` 用来写行内代码
- 三个反引号用来写代码块
- `[文字](链接)` 用来写链接
- `![说明](图片地址)` 用来写图片
- `../assets/...` 可以引用本仓库的资源文件

> 一开始不用追求写得特别花。  
> 能把标题、列表、代码块、图片、链接用顺手，就已经够写大部分博客文章了
