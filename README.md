# Cici Codex Pet

Cici is Chinesia's cheerful panda companion, now available as a custom pet for the Codex desktop app.

![Cici Codex Pet animation states](preview.png)

## Install

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

## 安装方法

1. 下载本仓库并解压。
2. 在文件夹中打开“终端”。
3. 运行 `chmod +x install.sh`，再运行 `./install.sh`。
4. 完全退出并重新打开 Codex。
5. 在自定义宠物中选择 `Cici`。

## Animation states

The V2 sprite atlas contains idle, running-right, running-left, waving, jumping, failed, waiting, running, review, and directional-look states.

## License

The installer and build tooling are released under the MIT License. Cici artwork is copyright Shenzhen Octopus Era Technology Development Co., Ltd. It may be used for personal, non-commercial use as part of this Codex pet package. See `LICENSE` and `NOTICE.md`.
