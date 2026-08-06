# ReadingLasses

## ⚠️ Configuração obrigatória antes de rodar (Docker + Expo)

Este projeto roda o frontend (Expo) e o backend dentro de containers Docker. Para testar o app no **Expo Go** (celular), alguns ajustes manuais são necessários — sem eles, o app pode funcionar normalmente no navegador do PC, mas não conseguirá se comunicar com o celular.

---

## 1. Descubra o IP da sua máquina

O frontend (Expo) e o aplicativo no celular precisam acessar o backend através do **IP da máquina hospedeira**, e não por `localhost`.

### Windows

```powershell
ipconfig
```

Procure pelo **Endereço IPv4** da interface Wi-Fi ou Ethernet.

Exemplo:

```
Endereço IPv4 . . . . . . . . . . : 10.1.1.125
```

### Linux

```bash
ip addr
```

### macOS

```bash
ifconfig
```

---

## 2. Configure o Expo

No arquivo `docker-compose.yml`, altere:

```yaml
frontend:
  environment:
    - EXPO_PACKAGER_PROXY_URL=http://SEU_IP_LOCAL:8081
```

Exemplo:

```yaml
frontend:
  environment:
    - EXPO_PACKAGER_PROXY_URL=http://10.1.1.125:8081
```

Depois, reconstrua o container:

```bash
docker compose down
docker compose up -d --build
```

---

## 3. Configure a URL do backend

Atualmente o frontend utiliza diretamente o IP da máquina:

```javascript
const API_URL = "http://10.1.1.125:3000";
```

Troque esse endereço pelo IP obtido no passo anterior.

Exemplo:

```javascript
const API_URL = "http://SEU_IP_LOCAL:3000";
```

> Futuramente recomenda-se mover esse valor para uma variável de ambiente (`EXPO_PUBLIC_API_URL`).

---

## 4. Computador e celular devem estar na mesma rede

O computador e o celular precisam estar conectados à mesma rede Wi-Fi.

Caso contrário, o Expo Go não conseguirá acessar o backend nem o Metro Bundler.

---

## 5. Windows: libere a porta 3000 no Firewall

Mesmo com o Docker publicando corretamente a porta (`3000:3000`), o Windows Firewall pode bloquear conexões vindas de outros dispositivos da rede.

Crie uma regra liberando a porta:

```powershell
New-NetFirewallRule `
  -DisplayName "Allow Express Backend 3000" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 3000 `
  -Profile Private
```

Você pode confirmar que a regra foi criada com:

```powershell
Get-NetFirewallRule -DisplayName "Allow Express Backend 3000"
```

Depois disso, o endereço

```
http://SEU_IP_LOCAL:3000
```

deve abrir normalmente também no navegador do celular.

---

## 6. Confirme o perfil de rede

No Windows:

**Configurações → Rede e Internet → Wi-Fi → (sua rede) → Perfil de rede → Privada**

Redes públicas possuem regras de firewall mais restritivas.

---

## 7. Limpe o cache do Expo caso o IP mude

### Windows

```powershell
Remove-Item -Recurse -Force frontend\.expo -ErrorAction SilentlyContinue
```

### Linux/macOS

```bash
rm -rf frontend/.expo
```

Depois:

```bash
docker compose down
docker compose up -d --build
```

---

# Rodando o projeto

```bash
docker compose up -d --build
docker compose logs -f frontend
```

Procure por uma linha semelhante a:

```
Metro waiting on exp://SEU_IP_LOCAL:8081
```

O IP exibido deve ser o mesmo obtido com `ipconfig` (ou equivalente).

---

## Testando a conexão

No celular, abra:

```
http://SEU_IP_LOCAL:8081
```

Se a página do Metro abrir, o frontend está acessível.

Depois abra:

```
http://SEU_IP_LOCAL:3000
```

É esperado receber uma resposta do Express.

Se **8081 funcionar mas 3000 não**, o problema normalmente está relacionado ao Firewall do Windows.

---

## Abrindo o aplicativo

Abra o Expo Go e escaneie o QR Code exibido no terminal ou informe manualmente a URL:

```
exp://SEU_IP_LOCAL:8081
```