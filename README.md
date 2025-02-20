# Discord 👁️ - API

Uma API simples para obter status e atividades de usuários do Discord em tempo real. 
- Simples e memorável
- Sugere observação/monitoramento
- Fácil de usar em logos e branding

## 🚀 Como Usar

### Endpoint HTTP
```javascript
fetch('https://discord-presence-api.onrender.com/api/users/ID_DO_USUARIO')
  .then(res => res.json())
  .then(data => console.log(data))
```

### WebSocket (Tempo Real)
```javascript
import { io } from 'socket.io-client';

const socket = io('https://discord-presence-api.onrender.com');

socket.on('presenceUpdate', (data) => {
    console.log('Atualização de presença:', data);
});
```

## 📝 Exemplo de Resposta

```json
{
  "discord_user": {
    "id": "399547557883281419",
    "username": "ApoorLife",
    "avatar": "a_1b2c3d4e5f6g7h8i9j0"
  },
  "discord_status": "online",
  "activities": [
    {
      "name": "Visual Studio Code",
      "type": 0,
      "details": "Editando arquivo"
    }
  ]
}
```

## 🎮 Status Possíveis

- `online` - Usuário online
- `idle` - Usuário ausente
- `dnd` - Não perturbe
- `offline` - Usuário offline

## 📌 Observações

- API pública e gratuita
- Não requer autenticação
- Atualizações em tempo real via WebSocket
- O usuário precisa estar em um servidor que contenha o bot

## 💻 Exemplo em React

```javascript
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://discord-presence-api.onrender.com');

function DiscordStatus() {
    const [status, setStatus] = useState({});

    useEffect(() => {
        // Busca inicial
        fetch('https://discord-presence-api.onrender.com/api/users/399547557883281419')
            .then(res => res.json())
            .then(data => setStatus(data));

        // Atualização em tempo real
        socket.on('presenceUpdate', (data) => {
            setStatus(data);
        });

        return () => socket.off('presenceUpdate');
    }, []);

    return (
        <div>
            <h3>{status.discord_user?.username}</h3>
            <p>Status: {status.discord_status}</p>
            {status.activities?.[0] && (
                <p>Jogando: {status.activities[0].name}</p>
            )}
        </div>
    );
}

export default DiscordStatus;
```

## 🤝 Contribuição

Sinta-se à vontade para contribuir com o projeto através de issues ou pull requests.

## 📄 Licença

MIT License

## 📞 Contato

Para dúvidas ou suporte, entre em contato através do Discord: ApoorLife#0000

---

**Nota:** Este projeto não é afiliado ao Discord Inc.
