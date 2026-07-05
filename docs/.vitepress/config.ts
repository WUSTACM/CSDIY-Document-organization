import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

export default defineConfig({
  base: '/',
  title: "WUST--CSDIY文档",
  description: "WUST 计算机自学指南",
  
  themeConfig: {
    // 1. 顶部导航 (极少变动，手动保留大类即可)
    nav: [
      { text: '首页', link: '/' },
      { text: '序言', link: '/xuyan/' },
      // { text: '算法与数据结构', link: '/algorithm/' }
    ],

    // 2. 侧边栏 (彻底自动化：动态扫描物理文件夹)
    sidebar: generateSidebar({
      documentRootPath: 'docs',       // 扫描的物理根目录
      useTitleFromFrontmatter: true,  // 核心：直接从 Markdown 内部提取标题
      useFolderTitleFromIndexFile: true, // 使用目录下的 index.md 作为文件夹展示名称
      collapsed: false,               // 默认展开侧边栏
      sortMenusByFrontmatterOrder: true // 支持自定义排序
    }),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/WUSTACM/CSDIY-Document-organization' }
    ]
  }
})