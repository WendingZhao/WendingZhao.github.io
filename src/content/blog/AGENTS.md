# 注意事项

## 编辑操作注意事项

### 错误做法

使用空字符串作为 `oldString` 进行替换，可能导致正文内容丢失：

```typescript
// 错误示例
edit({ oldString: '', newString: '...' })
```

### 正确做法

在文件开头添加 frontmatter 时，必须指定文章中第一个实际内容的标题行作为 `oldString`，确保正文内容不被覆盖：

```typescript
// 正确示例 - 以第一个标题行作为锚点
edit({
  filePath: '...',
  oldString: '## Conventional Commits',
  newString: frontmatter + '\n\n## Conventional Commits'
})
```

在添加 frontmatter 后再编辑正文内容。
