# 配置 Astro 博客文章头部

当用户提到补全或配置 blog 中文章的 frontmatter 信息时，自动配置。

## 输入

启动短语：

- "配置文章 frontmatter"
- "补全文章信息"
- 或类似提及配置/补全 blog 文章的含义

## 步骤

1. 使用 `git status` 检查 blog 目录下未跟踪的目录
2. 查找文件夹中的 `index.md` 或 `index.mdx` 文件
3. 读取并解析现有的 frontmatter
4. 检查目录下是否有图片文件（如 `.jpg`, `.png`, `.webp` 等）
5. 根据目录状态配置 frontmatter：
   - **未跟踪的新目录**：配置 `publishDate` 为当前日期，添加完整的 frontmatter
   - **已修改的目录**：根据当前日期添加或更新 `updatedDate` 字段

## Frontmatter 规范

根据 [Astro Pure 主题文档](https://astro-pure.js.org/docs/setup/content#markdown-authoring)：

### 必需字段

| 字段          | 说明     | 格式/限制                                 |
| ------------- | -------- | ----------------------------------------- |
| `title`       | 文章标题 | 最多60字符                                |
| `description` | 文章描述 | 10-160字符                                |
| `publishDate` | 发布日期 | `'YYYY-MM-DD'` 或 `'YYYY-MM-DD HH:MM:SS'` |

### 可选字段

| 字段          | 说明         | 默认值      |
| ------------- | ------------ | ----------- |
| `tags`        | 标签数组     | `[]`        |
| `heroImage`   | 封面图对象   | 无          |
| `draft`       | 是否草稿     | `false`     |
| `language`    | 语言         | `'English'` |
| `comment`     | 是否开启评论 | `true`      |
| `updatedDate` | 更新日期     | 无          |

### 图片处理

当文章目录下存在图片文件（如 `.jpg`, `.png`, `.webp` 等）时，自动将其作为 `heroImage`：

- 使用目录中已有的图片文件，优先选择 `thumbnail`、`cover` 或首个图片文件
- `alt` 字段使用文章标题或通用描述
- `src` 使用相对路径 `./image.png` 格式
- 从图片中提取主色调作为 `color` 字段（使用 6 位十六进制颜色码）

### heroImage 格式

```yaml
heroImage:
  src: './thumbnail.jpg'
  alt: '图片描述'
  color: '#B4C6DA'
```

或远程图片：

```yaml
heroImage:
  src: 'https://example.com/image.jpg'
  inferSize: true
```

## 输出

更新后的 frontmatter，保持原有字段不变，**补全所有缺失的字段（包括可选字段）**。

## 注意事项

### YAML 格式问题

heroImage 字段应使用多行缩进格式，避免解析错误：

```yaml
heroImage:
  src: './image.png'
  alt: '图片描述'
  color: '#2496ED'
```

不要使用单行对象格式 `{ src: './image.png', alt: '...', color: '...' }`，可能导致解析错误。
