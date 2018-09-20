# Server

### Install
```npm install```
#### Dependencies
- Add kxstudio repositories
```# apt-get install libjack0 libjack-dev libsndfile1-dev sox jack-capture cadence opus-tools lame soxi```

https://github.com/danmbox/jack-file


### Running
```npm start```



----
iniciar sessao jack
  opusdec --force-wav ../teste.opus ../teste.wav     [se o sox instalado nao tem suporte a opus (verificar com o comando opus -h), tem que converter para .wav antes. uma opcao eh compilar habilitando o suporte a opus.]
  ./file2jack -at 0 -i ../teste.wav
//iniciar guitarix
//selecionar configs guitarix
conectar filejack no guitarix
iniciar cadence render (ou na real o jack_capture com os params certos)
fechar render
//fechar guitarix
fecha sessao jack
