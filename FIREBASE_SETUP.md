# Configuração do Firebase Storage

Este documento explica como configurar o Firebase Storage para substituir o armazenamento local de imagens.

## Alterações Realizadas

### 1. Backend - Serviços e Controllers
- **Instalado**: `firebase-admin` para integração com Firebase Storage
- **Criado**: `FirebaseStorageService` para gerenciar uploads e downloads
- **Atualizado**: Controllers de fotos de perfil para usar Firebase Storage
- **Mantido**: Estrutura de tabela existente (campo `filepath` agora armazena URLs do Firebase)

### 2. Configuração do Multer
- Alterado para `memoryStorage` nos uploads de perfil (student e trainer)
- Arquivos são processados em memória e enviados diretamente para o Firebase

### 3. Estrutura de Dados
- **Campo `filepath`**: Agora armazena a URL pública do Firebase Storage
- **Campo `filename`**: Mantém o nome do arquivo gerado pelo Firebase
- **Sem alterações na estrutura das tabelas**: Compatibilidade total com código existente

## Configuração Necessária

### 1. Criar Service Account no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `high-training`
3. Vá em **Project Settings** > **Service Accounts**
4. Clique em **Generate new private key**
5. Baixe o arquivo JSON

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Configuração Firebase Admin SDK
FIREBASE_PRIVATE_KEY_ID=valor_do_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_private_key_completa_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@high-training.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=valor_do_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40high-training.iam.gserviceaccount.com
```

**Importante**: 
- Substitua os valores pelos dados do seu arquivo JSON de service account
- A `FIREBASE_PRIVATE_KEY` deve incluir as quebras de linha `\n`
- Mantenha as aspas duplas na variável `FIREBASE_PRIVATE_KEY`

### 3. Configurar Storage Rules (Firebase Console)

No Firebase Console, vá em **Storage** > **Rules** e configure:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leitura pública para todas as imagens
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false; // Apenas o backend pode escrever
    }
  }
}
```

## Estrutura de Pastas no Firebase Storage

O sistema organizará as imagens nas seguintes pastas:

```
high-training.firebasestorage.app/
├── student-profile-photos/
│   └── {student_id}-{timestamp}-{uuid}.jpg
├── trainer-profile-photos/
│   └── {trainer_id}-{timestamp}-{uuid}.jpg
├── student-progress-photos/
│   └── {student_id}-{timestamp}-{uuid}.jpg
├── feedback-photos/
│   └── {feedback_id}-{timestamp}-{uuid}.jpg
└── timeline-photos/
    └── {user_id}-{timestamp}-{uuid}.jpg
```

## Controllers Atualizados

### StudentProfilePhotoController
- ✅ Upload para Firebase Storage
- ✅ Download via redirect para URL do Firebase
- ✅ Delete remove apenas registro do banco (URL fica inválida)

### TrainerProfilePhotoController  
- ✅ Upload para Firebase Storage
- ✅ Download via redirect para URL do Firebase
- ✅ Delete remove apenas registro do banco (URL fica inválida)

## Funcionalidades

### Upload
1. Arquivo é recebido via Multer (memoryStorage)
2. Buffer é enviado para Firebase Storage
3. URL pública é retornada e salva no campo `filepath`
4. Metadados são salvos no banco de dados

### Download
1. Controller busca registro no banco
2. Redireciona para URL do Firebase (campo `filepath`)
3. Firebase serve a imagem diretamente

### Delete
1. Remove registro do banco de dados
2. URL do Firebase fica inválida automaticamente
3. Limpeza manual de arquivos órfãos pode ser feita se necessário

## Vantagens da Implementação

1. **Compatibilidade**: Mantém estrutura de tabela existente
2. **Performance**: URLs diretas do Firebase (CDN global)
3. **Escalabilidade**: Sem limite de armazenamento local
4. **Segurança**: Service Account com permissões específicas
5. **Manutenção**: Reduz complexidade de backup de arquivos

## Próximos Passos

1. Configurar as variáveis de ambiente
2. Testar upload de fotos de perfil
3. Verificar se as URLs estão sendo geradas corretamente
4. Aplicar a mesma lógica para outros controllers de fotos se necessário

## Troubleshooting

### Erro de Autenticação
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o service account tem permissões no Storage

### Erro de Upload
- Verifique se o bucket está configurado corretamente
- Confirme se as regras do Storage permitem escrita pelo service account

### URLs Inválidas
- Verifique se as regras do Storage permitem leitura pública
- Confirme se a URL está sendo salva corretamente no banco
