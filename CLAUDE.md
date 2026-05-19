# Claude Code 项目规范

## 核心逻辑：
优先考虑在现有代码上改动小的方案，效率和可运行优先，代码要可维护可拓展。新引入的库写入requirement.txt中

## 任务执行思路
1.按需求实现，不需要你验证，保证效率和不增加额外代码。不要自己添加README.md除非我要求。
2.如果有问题，再进行修正。

## 🔴 CRITICAL: Git提交规范

### ⚠️ 每次代码修改后必须git提交

**禁止事项：**
- ❌ 修改文件后不提交
- ❌ 只提交部分文件
- ❌ 忘记检查git status
- ❌ 提交前不验证修改内容

### ✅ Git提交检查清单

**每次修改代码后，必须执行以下步骤：**

```bash
# 1. 检查所有修改的文件
git status

# 2. 查看具体修改内容
git diff

# 3. 添加所有相关文件
git add .

# 4. 提交（必须包含详细描述）
git commit -m "类型: 描述

- 具体修改点1
- 具体修改点2
- 影响范围

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### 📋 提交前必须验证

1. **确认所有修改的文件都被添加**
   ```bash
   git status  # 应该看到 "nothing to commit, working tree clean"
   ```

2. **确认修改内容正确**
   ```bash
   git diff --staged  # 查看将要提交的修改
   ```

3. **确认构建成功**
   ```bash
   npm run build  # 前端
   # 或
   python -m pytest  # 后端测试
   ```

### 🎯 为什么会漏掉文件？

**常见原因：**
- 在错误的目录工作（前端/后端混淆）
- 使用`git add`时只添加部分文件
- 创建新文件时忘记`git add`
- 修改后没有检查`git status`
- 多个文件修改时只记得主要的

**解决方案：**
```bash
# 每次修改后立即执行
git add -A
git status  # 确认所有文件都已添加
```

### 📝 提交信息格式

```bash
git commit -m "类型: 简短描述

详细说明：
- 修改点1
- 修改点2
- 影响的页面/功能
- 修复的问题

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

**类型标签：**
- `Fix:` 修复bug
- `Add:` 添加新功能
- `Update:` 更新现有功能
- `Refactor:` 重构代码
- `Remove:` 删除功能
- `Restore:` 恢复功能
- `Optimize:` 性能优化

### 🚨 强制提交检查点

**以下情况必须git提交：**
1. ✅ 修改任何 `.tsx`、`.ts` 文件
2. ✅ 修改任何 `.py` 文件
3. ✅ 修改配置文件（`.env`、`package.json`等）
4. ✅ 添加新文件
5. ✅ 删除文件
6. ✅ 重构代码
7. ✅ 修复bug
8. ✅ 完成用户请求的任何修改

**唯一例外：**
- 只修改注释（但建议也提交）
- 修改空行或格式（但建议也提交）

### 🔄 工作流程示例

```bash
# 1. 用户请求修改
用户："修复Activities页面的loading问题"

# 2. 修改代码
vim src/pages/Activities.tsx

# 3. 立即检查状态
git status
# 输出: modified:   src/pages/Activities.tsx

# 4. 添加并提交
git add src/pages/Activities.tsx
git commit -m "Fix: Activities页面无限loading问题

- 修改useEffect依赖数组，移除fetchActivities和fetchBusinessCategories
- 只保留currentCompanyId作为依赖
- 防止无限重新渲染

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 5. 验证提交
git status
# 输出: nothing to commit, working tree clean
```

### 📊 当前项目状态

```bash
# 前端
cd /Users/shaw/Downloads/esg-frontend-main

# 后端
cd /Users/shaw/Downloads/esg-backend-main
```

**注意：** 始终确认你在正确的目录工作！

---

## 项目技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **路由**: React Router v6
- **状态管理**: React Hooks (useState, useEffect, useCallback)
- **API**: 自定义hooks (use-api.ts)
- **通知**: Sonner (toast)
- **图表**: Recharts
- **PDF**: jsPDF
- **网格布局**: react-grid-layout
- **拖拽**: @dnd-kit

### 后端
- **框架**: FastAPI + Python 3.9
- **数据库**: Supabase (PostgreSQL)
- **AI**: Zhipu AI (GLM模型)
- **认证**: JWT
- **文件处理**: Supabase Storage

### 开发工具
- **包管理**: npm (前端), pip (后端)
- **代码规范**: ESLint + Prettier
- **版本控制**: Git

---

## 常见问题

### Q: 如何确认我是否在正确的目录？
```bash
pwd
# 前端应该是: /Users/shaw/Downloads/esg-frontend-main
# 后端应该是: /Users/shaw/Downloads/esg-backend-main
```

### Q: 如何查看最近的提交？
```bash
git log --oneline -10
```

### Q: 如果提交后发现遗漏了文件？
```bash
# 添加遗漏的文件
git add遗漏的文件
# 修改最后一次提交
git commit --amend --no-edit
```

### Q: 如何撤销错误的提交？
```bash
# 撤销最后一次提交，保留修改
git reset --soft HEAD~1
```

---

## 重要提醒

⚠️ **永远不要忘记git提交！**

⚠️ **每次修改后立即检查git status！**

⚠️ **如果不确定，执行 `git add -A` 提交所有修改！**

⚠️ **用户明确要求："记住，后续每次更新git提交！"**
