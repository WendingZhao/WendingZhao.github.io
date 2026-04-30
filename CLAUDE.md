# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 **Astro Theme Pure** 构建的个人博客网站，部署在 `https://pengwee.wang`。使用 Astro 5.x 静态站点生成器，主题为 astro-pure 1.4.2。

## 技术栈

- **框架**: Astro 5.17.3
- **主题**: astro-pure 1.4.2
- **样式**: UnoCSS 66.6.8 (原子化 CSS)
- **包管理器**: bun (推荐) 或 npm
- **语言**: TypeScript (严格模式)
- **语法高亮**: Shiki
- **数学公式**: KaTeX + remark-math + rehype-katex
- **评论系统**: Waline

## 常用命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动开发服务器 |
| `bun dev:check` | 启动开发服务器并开启类型检查监听 |
| `bun run build` | 构建生产版本 (包含检查) |
| `bun preview` | 预览构建结果 |
| `bun sync` | 同步 Astro 内容集合类型 |
| `bun check` | 运行 Astro 类型检查 |
| `bun format` | 格式化代码 (Prettier) |
| `bun lint` | 修复代码 (ESLint) |
| `bun yijiansilian` | 一站式检查 (lint + sync + check + format) |
| `bun pure new` | 创建新博客文章 |
| `bun cache:avatars` | 缓存友链头像 |

## 项目结构

```
src/
├── components/      # 自定义组件 (about, home, links, projects, waline)
├── content/         # 博客内容 (Markdown/MDX)
│   └── blog/        # 博客文章目录
├── layouts/         # 页面布局
├── pages/           # 路由页面 (blog, projects, links, about, search, tags, archives)
├── plugins/         # Astro 插件
└── site.config.ts   # 站点核心配置
```

## 核心配置文件

- **src/site.config.ts**: 站点配置 (标题、作者、导航菜单、页脚、集成功能等)
- **astro.config.ts**: Astro 框架配置
- **uno.config.ts**: UnoCSS 样式配置
- **tsconfig.json**: TypeScript 配置 (包含路径别名)

## 路径别名

```
@/assets/*     → src/assets/*
@/components/* → src/components/*
@/layouts/*    → src/layouts/*
@/utils        → src/utils/index.ts
@/plugins/*    → src/plugins/*
@/pages/*      → src/pages/*
@/types        → src/types/index.ts
@/site-config  → src/site.config.ts
```

## 主要功能

- **博客系统**: Markdown/MDX 支持、标签、归档、分页、草稿模式
- **集成功能**: Pagefind 全站搜索、Waline 评论、MediumZoom 图片灯箱
- **其他**: Sitemap、RSS 订阅、动态 Open Graph 图片、目录 (TOC)

## 内容管理

博客文章存放在 `src/content/blog/` 目录，使用 `bun pure new` 命令创建新文章。
