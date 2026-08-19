# Cici Codex Pet

Cici is Chinesia's cheerful panda companion, now available as a custom pet for the Codex desktop app.

![Cici Codex Pet animation states](preview.png)

## Quick download

- [Download for macOS](https://github.com/tansel-chen/cici-codex-pet/releases/latest/download/Cici-Codex-Pet-macOS.zip)
- [Download for Windows](https://github.com/tansel-chen/cici-codex-pet/releases/latest/download/Cici-Codex-Pet-Windows.zip)

## Install on macOS

1. Download `Cici-Codex-Pet-macOS.zip` from the link above.
2. Extract the ZIP file completely.
3. Double-click `install-macos.command`.
4. Fully quit and reopen Codex.
5. Select `Cici` from the custom pet selector.

The installer copies the pet to `~/.codex/pets/cici`. If `CODEX_HOME` is set, it uses `$CODEX_HOME/pets/cici` instead.

## Install on Linux

1. Download or clone this repository.
2. Open Terminal in the repository folder.
3. Run:

```bash
chmod +x install.sh
./install.sh
```

4. Fully quit and reopen Codex.
5. Select `Cici` from the custom pet selector.

The installer copies the pet to `~/.codex/pets/cici`. If `CODEX_HOME` is set, it uses `$CODEX_HOME/pets/cici` instead.

## Install on Windows

1. Download `Cici-Codex-Pet-Windows.zip` from the link above.
2. Extract the ZIP file completely.
3. Open the extracted folder and double-click `install-windows.bat`.
4. When Windows shows that the installation is complete, press any key to close the window.
5. Fully quit and reopen Codex.
6. Select `Cici` from the custom pet selector.

The Windows installer copies the pet to `%USERPROFILE%\.codex\pets\cici`. If `CODEX_HOME` is set, it uses `%CODEX_HOME%\pets\cici` instead.

## macOS 安装方法

1. 点击上方的 `Download for macOS`。
2. 将 ZIP 文件完整解压。
3. 双击 `install-macos.command`。
4. 完全退出并重新打开 Codex。
5. 在自定义宠物中选择 `Cici`。

## Linux 安装方法

1. 下载本仓库并解压。
2. 在文件夹中打开“终端”。
3. 运行 `chmod +x install.sh`，再运行 `./install.sh`。
4. 完全退出并重新打开 Codex。
5. 在自定义宠物中选择 `Cici`。

## Windows 安装方法

1. 点击上方的 `Download for Windows`。
2. 将 ZIP 文件完整解压，不要直接在压缩包内运行文件。
3. 打开解压后的文件夹，双击 `install-windows.bat`。
4. 看到安装完成提示后，按任意键关闭窗口。
5. 完全退出并重新打开 Codex。
6. 在自定义宠物中选择 `Cici`。

Windows 安装器会将文件复制到 `%USERPROFILE%\.codex\pets\cici`。

## Animation states

The V2 sprite atlas contains idle, running-right, running-left, waving, jumping, failed, waiting, running, review, and directional-look states.

## License

The installer and build tooling are released under the MIT License. Cici artwork is copyright Shenzhen Octopus Era Technology Development Co., Ltd. It may be used for personal, non-commercial use as part of this Codex pet package. See `LICENSE` and `NOTICE.md`.
