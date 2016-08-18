
# Future Home Contorller for Homebridge
フューチャーホームコントローラーのwebapiを homebrigeに対応させて、siriから呼び出してみるテスト。

## Device Support
フューチャーホームコントローラーという音声認識で家電操作をするガジェットがある。
独自の音声認識エンジンを搭載していて、なんでもできる。
ただ、siriから使いたいとお前が言うなら仕方がない。対応させてやんよ。

ただし、まだ Switchとしてしか対応させていない。
エアコンをService.Thermostatとかにしたいけど、対応させる項目多すぎるんよー。


## Installation

まず、Homebridgeをインストールする [Homebridge](https://github.com/nfarina/homebridge)
その後で、このプラグインを入れてくれ。コマンドだとこうなる。

    npm install -g homebridge-fhc

そして、 config.jsonに次のように書いてくれ。

    "platforms": [
         {
             "platform" : "FHC",
             "name" : "FHC",
             "apikey" : "<<WEBAPIKEY>>",
             "host" : "<<FHC LOCAL IP 例: http://192.168.1.123 >>"
         }
    ]

## Installation その2

別鯖にnodejsとか入れるのがだるい場合は、FHC端末内にnodejsを入れる技がある。
ただし、自己責任でやること。
そして、第4次ロット以後(2013年6月以後出荷分)の新しいロットでしか動かないと思う。


     まずsshでFHCに接続して、su - で root になろう。
     https://rti-giken.jp/fhc/help/howto/ssh.html
     
     #なにはともあれパッケージのアップデート
     opkg update
     
     #dns_sd.hが必要です。
     opkg install avahi-dev
     
     #opkg install nodejs だともっと古すぎて動かないのでダメです。
     #残念ながら gccが古いので、 0.12.x系しかビルドできません。
     wget http://nodejs.org/dist/v0.12.9/node-v0.12.9.tar.gz
     tar zxvf node-v0.12.9.tar.gz
     cd node-v0.12.9
     ./configure
     make
     
     #make には4時間ほどかかります。
     #makeする前に、CPUリソースとメモリを空ける意味で、
     #マイクを抜くことをおすすめします。
     #マイクが刺さっていると音声認識でCPU使ってしまうので、安定させるためにマイクを抜きましょう。
     
     #makeが終わったらinstallします。
     #/usr/local/ に、 nodejs が入ります。
     make install
     
     #バージョン確認
     0.12.9 と表示されればok
     node -v
     
     
     #これでnpmすれば・・・と思うかもしれませんが、
     #dns_sd.hが必要で、opkgでは入らないので、 avahiをビルドします。
     #see https://github.com/agnat/node_mdns/issues/73
     
     opkg install libssp-dev
     opkg install intltool
     opkg install avahi-dev
     
     wget http://avahi.org/download/avahi-0.6.31.tar.gz
     tar zxvf avahi-0.6.31.tar.gz
     cd avahi-0.6.31
     
     export PTHREAD_CFLAGS='-lpthread'
     ./configure --disable-static --disable-mono --disable-monodoc --disable-gtk3 --disable-gtk --disable-qt3 --disable-python --disable-qt4 --disable-core-docs --enable-compat-libdns_sd --disable-tests --with-distro=none
     make
     
     ##make install してはいけない
     ##必要なファイルだけコピーする
     cp avahi-compat-libdns_sd/.libs/libdns_sd.so /usr/lib/
     cp avahi-compat-libdns_sd/dns_sd.h /usr/include/
     ln -s /usr/lib/libdns_sd.so /usr/lib/libdns_sd.so.1
     
     #なんかいるらしい
     mkdir /home/root/.node-gyp
     
     #やっと入れられます。
     #こちらは1時間ぐらいかかります。
     npm install -g --unsafe-perm homebridge
     
     
     #このモジュールを入れよう
     npm install -g homebridge-fhc
     または、ソースコードを /usr/local/lib/node_modules/homebridge-fhc にコピーしてください。
     
     #設定をかこう
     vim /home/root/.homebridge/config.json
     --------------------------------------
     {
         "bridge": {
             "name": "Homebridge",
             "username": "<MAC_ADDRESS>",
             "port": 51826,
             "pin": "031-45-154"
         },
     
         "description": "<DESCRIPTION>",
     
         "platforms": [
             {
                 "platform" : "FHC",
                 "name" : "FHC",
                 "apikey" : "<<APIKEY>>",
                 "host" : "http://127.0.0.1"
             }
     
         ]
     
     }
     --------------------------------------
     
     #まずは、 avahi を立ち上げる。
     #homekit って Bonjour とか使って、DNS のtxtレコードとかを利用してなんかやっているらしいですよ。
     /etc/init.d/avahi-daemon
     
     #homebrigeを立ち上げる
     #とりあえずこれで動く。
     homebridge
     
     #iphoneとかipadとかにinsteon+(無料)を入れてください。
     #(insteon for hub ではなくて、insteon+の方です)
     #これで動作を確認してください。
     https://itunes.apple.com/jp/app/insteon+/id919270334
     
     
     #無事うまく動作するようならば、自動起動の設定をします
     #avahi が自動起動するようにする.
     ln -s /lib/systemd/system/avahi-daemon.service /etc/systemd/system/multi-user.target.wants/
     ln -s /lib/systemd/system/avahi-daemon.socket /etc/systemd/system/sockets.target.wants/
     
     #起動スクリプトを作ります.
     #systemdだけだとタイミングがずれて駄目になるのでshellscriptを作る
     vim /home/root/homebridge.sh
     -------------------------------------------------
     #!/bin/sh
     # wait wakeup avahi and FHC Process.
     sleep 120
     
     PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin
     HOME=/home/root
     
     # run homebridge
     homebridge > /tmp/homebridge.log
     #homebridge
     -------------------------------------------------
     
     chmod +x /home/root/homebridge.sh
     
     #homebridgeを起動させるためのsystemdを書く.
     #本当権限分離したかったが、分離すると何故かうまくいかない・・・
     vim /lib/systemd/system/homebrige.service
     -------------------------------------------------
     [Unit]
     Description=Node.js HomeKit Server
     After=avahi-daemon.service
     
     [Service]
     Type=simple
     User=root
     ExecStart=/home/root/homebridge.sh
     RestartSec=10
     KillMode=process
     
     [Install]
     WantedBy=multi-user.target
     -------------------------------------------------
     
     #自動起動登録.
     ln -s /lib/systemd/system/homebrige.service /etc/systemd/system/multi-user.target.wants/
     
     #ここまで作ったら再起動してみましょう。
     sync
     reboot
     
     #しばらく待つと FHC プロセスが上がり
     #2分後に、 homebridgeも上がります。
     #2分後にしている理由は FHC のDHCPタイムアウトが2分のためです。
     #安全をとって伸ばしています。最初だけなので少しだけ待ってください。


## 遊び方
iphoneとかipadとかにinsteon+(無料)を入れてください。
(insteon for hub ではなくて、insteon+の方です)
https://itunes.apple.com/jp/app/insteon+/id919270334


insteon+で scanすると、homebridge が見れると思います。
あとは、自由に操作してください。


## 勝手にthanks
このソースコードは、 homebridge-homeassistant と homebridge-samsungtv-control を参考に作りました。


## Contributions

* fork
* create a feature branch
* open a Pull Request
