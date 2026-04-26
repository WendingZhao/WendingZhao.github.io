# 配置 Astro 博客文章头部

当用户提供一个文件夹路径时，配置或补全该文件夹中博客文章的 frontmatter 信息。

## 输入

用户提供的文件夹路径，例如：`src/content/blog/my-article/`

## 步骤

1. 查找文件夹中的 `index.md` 或 `index.mdx` 文件
2. 读取并解析现有的 frontmatter
3. 检查并补全缺失的字段

## Frontmatter 规范

根据 [Astro Pure 主题文档](https://astro-pure.js.org/docs/setup/content#markdown-authoring)：

### 必需字段

| 字段          | 说明     | 格式/限制                                 |
| ------------- | -------- | ----------------------------------------- |
| `title`       | 文章标题 | 最多60字符                                |
| `description` | 文章描述 | 10-160字符                                |
| `publishDate` | 发布日期 | `'YYYY-MM-DD'` 或 `'YYYY-MM-DD HH:MM:SS'` |

### 可选字段

| 字段        | 说明         | 默认值      |
| ----------- | ------------ | ----------- |
| `tags`      | 标签数组     | `[]`        |
| `heroImage` | 封面图对象   | 无          |
| `draft`     | 是否草稿     | `false`     |
| `language`  | 语言         | `'English'` |
| `comment`   | 是否开启评论 | `true`      |

### heroImage 格式

```yaml
heroImage: { src: './thumbnail.jpg', alt: '图片描述', color: '#B4C6DA' }
```

或远程图片：

```yaml
heroImage: { src: 'https://example.com/image.jpg', inferSize: true }
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
