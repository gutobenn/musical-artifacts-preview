# Musical Artifacts preview
TODO description

#DEV
## server:
npm start
## client:
npm start
in another terminal, keep yarn running: yarn run sass

# Production - Install
Tested in a machine with Ubuntu 18.04 LTS. Replace 'preview.musical-artifacts.com' with your domain.

## Swap partition
sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo chmod 600 /var/swap.1
sudo /sbin/swapon /var/swap.1

To enable it by default after reboot, add this line to /etc/fstab:
/var/swap.1   swap    swap    defaults        0   0

## Install NGINX and SSL
sudo add-apt-repository ppa:certbot/certbot
sudo apt update
sudo apt install nginx software-properties-common python-certbot-nginx
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/preview.musical-artifacts.com
Edit the file:
sudo vim /etc/nginx/sites-available/preview.musical-artifacts.com
sudo ln -s /etc/nginx/sites-available/preview.musical-artifacts.com /etc/nginx/sites-enabled/
test configuration with sudo nginx -t
sudo systemctl restart nginx

sudo certbot --nginx

## Audio Processing Server
### Add kxstudio repositories
Follow the instructions on https://kxstudio.linuxaudio.org/Repositories

### Applications
sudo apt-get install jack guitarix

## TODO
nvm?
baixar pacotes (instalar git)
instalar dependencias python, js e tal
configurar proxy pass
production build
setup inicial banco de dados
configurar cronjob
rodar servidor. botar como serviço?
pipreqs
