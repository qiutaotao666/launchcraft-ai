# GitHub 网页版上传步骤

目标仓库：

```text
https://github.com/qiutaotao666/launchcraft-ai
```

## 1. 新建仓库

1. 登录 GitHub。
2. 点右上角 `+`，选择 `New repository`。
3. Repository name 填 `launchcraft-ai`。
4. 选择 `Public`。
5. 点 `Create repository`。

## 2. 上传文件

1. 进入新仓库。
2. 点 `Add file -> Upload files`。
3. 打开本机的：

```text
D:\Users\OneDrive\Desktop\demo1\简历\ai-launchcraft
```

4. 把 `README.md`、`server.py`、`static`、`docs`、`preview-static.png`、`.gitignore` 和本文件一起拖进上传区域。
5. 不要上传 `.edge-profile`、`.edge-mobile`、`.edge-static`、`__pycache__` 和日志文件。
6. 填写提交信息，例如 `Add LaunchCraft demo`。
7. 点 `Commit changes`。

## 3. 开启 GitHub Pages

1. 进入仓库的 `Settings`。
2. 左侧选择 `Pages`。
3. `Source` 选择 `Deploy from a branch`。
4. Branch 选择 `main`。
5. Folder 选择 `/docs`。
6. 点 `Save`。
7. 等待 1 到 2 分钟。

公开访问地址：

```text
https://qiutaotao666.github.io/launchcraft-ai/
```

代码地址：

```text
https://github.com/qiutaotao666/launchcraft-ai
```

## 4. 检查

打开公开地址，确认：

- 页面不是空白
- 点击“生成页面”有结果
- 切换语气和主题有效
- 复制 JSON 和下载 HTML 可用

如果 Pages 显示 404，先检查：

- 仓库是否是 Public
- Pages 的 branch 是否是 `main`
- Pages 的 folder 是否是 `/docs`
- `docs/index.html` 是否存在
