
# Future Home Contorller for Homebridge
�t���[�`���[�z�[���R���g���[���[��webapi�� homebrige�ɑΉ������āAsiri����Ăяo���Ă݂�e�X�g�B

## Device Support
�t���[�`���[�z�[���R���g���[���[�Ƃ��������F���ŉƓd���������K�W�F�b�g������B
�Ǝ��̉����F���G���W���𓋍ڂ��Ă��āA�Ȃ�ł��ł���B
�����Asiri����g�������Ƃ��O�������Ȃ�d�����Ȃ��B�Ή������Ă���B

�������A�܂� Switch�Ƃ��Ă����Ή������Ă��Ȃ��B
�G�A�R����Service.Thermostat�Ƃ��ɂ��������ǁA�Ή������鍀�ڑ���������[�B


## Installation

�܂��AHomebridge���C���X�g�[������ [Homebridge](https://github.com/nfarina/homebridge)
���̌�ŁA���̃v���O�C�������Ă���B�R�}���h���Ƃ����Ȃ�B

    npm install -g homebridge-fhc (�\��)

�����āA config.json�Ɏ��̂悤�ɏ����Ă���B

   "platforms": [
        {
            "platform" : "FHC",
            "name" : "FHC",
            "apikey" : "<<WEBAPIKEY>>"
            "host" : "<<FHC LOCAL IP ��: http://192.168.1.123 >>"
        }
   ]

## Installation ����2

�ʎI��nodejs�Ƃ������̂����邢�ꍇ�́AFHC�[������nodejs������Z������B
�������A���ȐӔC�ł�邱�ƁB
�����āA��4���ڍs�̐V�������b�g�ł��������Ȃ��Ǝv���B


�܂�ssh��FHC�ɐڑ����āAsu - �� root �ɂȂ낤�B
https://rti-giken.jp/fhc/help/howto/ssh.html

 #�Ȃɂ͂Ƃ�����p�b�P�[�W�̃A�b�v�f�[�g
 opkg update

 #dns_sd.h���K�v�ł��B
 opkg install avahi-dev

 #opkg install nodejs ���Ƃ����ƌÂ����ē����Ȃ��̂Ń_���ł��B
 #�c�O�Ȃ��� gcc���Â��̂ŁA 0.12.x�n�����r���h�ł��܂���B
 wget http://nodejs.org/dist/v0.12.9/node-v0.12.9.tar.gz
 tar zxvf node-v0.12.9.tar.gz
 cd node-v0.12.9
 ./configure
 make

 #make �ɂ�4���Ԃقǂ�����܂��B
 #make����O�ɁACPU���\�[�X�ƃ��������󂯂�Ӗ��ŁA
 #�}�C�N�𔲂����Ƃ��������߂��܂��B
 #�}�C�N���h�����Ă���Ɖ����F����CPU�g���Ă��܂��̂ŁA���肳���邽�߂Ƀ}�C�N�𔲂��܂��傤�B

 #make���I�������install���܂��B
 #/usr/local/ �ɁA nodejs ������܂��B
 make install

 #�o�[�W�����m�F
 0.12.9 �ƕ\��������ok
 node -v



 #�����npm����΁E�E�E�Ǝv����������܂��񂪁A
 #dns_sd.h���K�v�ŁAopkg�ł͓���Ȃ��̂ŁA avahi���r���h���܂��B
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

 ##make install ���Ă͂����Ȃ�
 ##�K�v�ȃt�@�C�������R�s�[����
 cp avahi-compat-libdns_sd/.libs/libdns_sd.so /usr/lib/
 cp avahi-compat-libdns_sd/dns_sd.h /usr/include/
 ln -s /usr/lib/libdns_sd.so /usr/lib/libdns_sd.so.1

 #�Ȃ񂩂���炵��
 mkdir /home/root/.node-gyp

 #����Ɠ�����܂��B
 #�������1���Ԃ��炢������܂��B
 npm install -g --unsafe-perm homebridge


 #���̃��W���[�������悤
 npm install -g homebridge-fhc (�\��)
 �܂��́A�\�[�X�R�[�h�� /usr/local/lib/node_modules/homebridge-fhc �ɃR�s�[���Ă��������B

 #�ݒ��������
 vim /home/root/.homebridge/config.json
 --------------------------------------
 {
     "bridge": {
         "name": "Homebridge",
         "username": "7C:66:9D:48:B4:28",
         "port": 51826,
         "pin": "031-45-154"
     },
 
     "description": "<DESCRIPTION>",
 
     "platforms": [
         {
             "platform" : "FHC",
             "name" : "FHC",
             "apikey" : "<<APIKEY>>"
             "host" : "http://127.0.0.1"
         }
 
     ]

 }
 --------------------------------------

 #�܂��́A avahi �𗧂��グ��B
 #homekit ���� Bonjour �Ƃ��g���āADNS ��txt���R�[�h�Ƃ��𗘗p���ĂȂ񂩂���Ă���炵���ł���B
 /etc/init.d/avahi-daemon

 #homebrige�𗧂��グ��
 homebridge


 #�Ƃ肠��������œ����B
 #todo daemon��


## �����thanks
���̃\�[�X�R�[�h�́A homebridge-homeassistant �� homebridge-samsungtv-control ���Q�l�ɍ��܂����B


## Contributions

* fork
* create a feature branch
* open a Pull Request
