# ReadinGlasses

## ⚠️ Configuração obrigatória antes de rodar (Docker + Expo)

Este projeto roda o frontend (Expo), o backend e serviços auxiliares (como o LibreTranslate) dentro de containers Docker. Para testar o app no **Expo Go** (celular), alguns ajustes de ambiente e rede são necessários — sem eles, o app pode funcionar normalmente no navegador do PC, mas não conseguirá se comunicar com o celular.

## 1. Descubra o IP da sua máquina

O frontend (Expo) e o aplicativo no celular precisam acessar o backend através do **IP da máquina hospedeira na rede local**, e não por `localhost`.

### Windows

```
ipconfig
```

Procure pelo **Endereço IPv4** da interface Wi-Fi ou Ethernet.
Exemplo: `Endereço IPv4 . . . . . . . . . . : 10.1.1.125`

### Linux

```
ip addr
```

### macOS

```
ifconfig
```

## 2. Configure as variáveis de ambiente (.env)

Em vez de alterar o código-fonte ou o arquivo `docker-compose.yml` manualmente, o projeto agora utiliza um arquivo `.env` para gerenciar as configurações.

Na **raiz do projeto** (onde está o `docker-compose.yml`), crie um arquivo chamado `.env` e adicione o IP obtido no passo anterior:

```
# Substitua pelo seu IP local
EXPO_PUBLIC_BACKEND_IP=10.1.1.125
EXPO_PUBLIC_BACKEND_PORT=3000

# Substitua pelo seu IP + Port
EXPO_PUBLIC_FRONTEND_URL=10.1.1.125:8081

# Adicione seu token do Expo
EXPO_TOKEN=seu_token

# Adiciona sua chave da API do Gemini
GEMINI_API_KEY=sua_chave_api
```

As variáveis `EXPO_PUBLIC_BACKEND_HOST` e `REACT_NATIVE_PACKAGER_HOSTNAME` serão configuradas automaticamente pelo Docker Compose com base nestes valores, e o seu frontend agora consegue consumir a API dinamicamente.

## 3. Computador e celular devem estar na mesma rede

O computador e o celular precisam estar conectados à **mesma rede Wi-Fi**.
Caso contrário, o Expo Go não conseguirá acessar o backend nem o Metro Bundler.

## 4. Windows: libere a porta 3000 no Firewall

Mesmo com o Docker publicando corretamente a porta (`3000:3000`), o Windows Firewall pode bloquear conexões vindas de outros dispositivos da rede.

Crie uma regra liberando a porta do backend abrindo o PowerShell como Administrador:

```
New-NetFirewallRule `
  -DisplayName "Allow Express Backend 3000" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 3000 `
  -Profile Private
```

*Nota: Confirme também se a sua rede no Windows está configurada como **Privada** (Configurações → Rede e Internet → Wi-Fi → Perfil de rede), pois redes públicas possuem regras mais restritivas.*

## 5. Rodando o projeto

Com o `.env` configurado, inicie os containers:

```
docker compose up -d --build
```

**Atenção ao LibreTranslate:** O serviço do backend depende que o `libretranslate` esteja pronto e saudável para iniciar. Como o LibreTranslate pode demorar um pouco para carregar seus modelos na primeira execução, o backend pode levar cerca de um minuto para ficar totalmente online.

Para acompanhar os logs do frontend e pegar o QR Code:

```
docker compose logs -f frontend
```

Procure por uma linha semelhante a `Metro waiting on exp://SEU_IP_LOCAL:PORTA_FRONT`.

## 6. Testando a conexão

No navegador do seu celular, tente acessar:

1. **Frontend (Metro Bundler):** `http://SEU_IP_LOCAL:PORTA_FRONT` (A página do Metro deve abrir).

2. **Backend:** `http://SEU_IP_LOCAL:PORTA_BACK` (É esperado receber uma resposta do Express).

Se a porta do frontend funcionar e a do backend não, o problema possivelmente está no Firewall do sistema operacional (reveja o Passo 4).

## 7. Abrindo o aplicativo

Abra o aplicativo **Expo Go** no celular e escaneie o QR Code exibido nos logs do terminal, ou informe manualmente a URL:

```
exp://SEU_IP_LOCAL:8081
```