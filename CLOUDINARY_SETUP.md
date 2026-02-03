# Migração do Firebase para Cloudinary - Guia de Configuração

## Visão Geral

Este projeto foi migrado do Firebase Storage para o Cloudinary para gerenciamento de imagens. O Cloudinary oferece melhor performance, otimização automática de imagens e recursos avançados de transformação.

## Configuração do Cloudinary

### 1. Criar Conta no Cloudinary

1. Acesse [cloudinary.com](https://cloudinary.com)
2. Crie uma conta gratuita
3. Acesse o Dashboard para obter suas credenciais

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configuração Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=sua_api_secret_aqui
```

**Como obter as credenciais:**
- **Cloud Name**: Encontrado no dashboard do Cloudinary
- **API Key**: Encontrado na seção "API Keys" do dashboard
- **API Secret**: Encontrado na seção "API Keys" do dashboard (mantenha seguro!)

### 3. Estrutura de Pastas no Cloudinary

O sistema organiza as imagens nas seguintes pastas:
- `student-profile-photos/` - Fotos de perfil dos estudantes
- `trainer-profile-photos/` - Fotos de perfil dos treinadores
- `student-progress-photos/` - Fotos de progresso dos estudantes
- `feedback-photos/` - Fotos de feedback
- `timeline-photos/` - Fotos da timeline

## Funcionalidades Implementadas

### CloudinaryStorageService

O novo serviço oferece:

- **Upload otimizado**: Compressão automática e formato otimizado
- **Transformações**: Redimensionamento e otimização em tempo real
- **Organização**: Estrutura de pastas organizada
- **Segurança**: URLs seguras com HTTPS
- **Performance**: CDN global para entrega rápida

### Métodos Disponíveis

```typescript
// Upload de imagens
uploadStudentProfilePhoto(buffer, originalName, studentId)
uploadTrainerProfilePhoto(buffer, originalName, trainerId)
uploadStudentProgressPhoto(buffer, originalName, studentId)
uploadFeedbackPhoto(buffer, originalName, feedbackId)
uploadTimelinePhoto(buffer, originalName, userId)

// Deletar imagens
deleteFile(publicId)

// Gerar URLs otimizadas
generateOptimizedUrl(publicId, options)
```

## Controladores Atualizados

### TrainerProfilePhotoController
- ✅ Upload de fotos de perfil
- ✅ Visualização de fotos
- ✅ Download/redirecionamento
- ✅ Exclusão com limpeza no Cloudinary

### StudentProfilePhotoController
- ✅ Upload de fotos de perfil
- ✅ Visualização de fotos
- ✅ Download/redirecionamento
- ✅ Exclusão com limpeza no Cloudinary

## Vantagens do Cloudinary

1. **Otimização Automática**: Compressão e formato automático (WebP, AVIF)
2. **Transformações**: Redimensionamento dinâmico via URL
3. **CDN Global**: Entrega rápida em qualquer lugar do mundo
4. **Backup Automático**: Redundância e segurança dos dados
5. **Analytics**: Métricas de uso e performance
6. **Custo-benefício**: Plano gratuito generoso

## Exemplo de URLs Geradas

### URL Original
```
https://res.cloudinary.com/seu-cloud-name/image/upload/v1234567890/student-profile-photos/123-1234567890-uuid.jpg
```

### URL com Transformações
```
https://res.cloudinary.com/seu-cloud-name/image/upload/w_300,h_300,c_fill,q_auto,f_auto/student-profile-photos/123-1234567890-uuid.jpg
```

## Migração de Dados Existentes

Se você tem imagens existentes no Firebase, será necessário:

1. Fazer download das imagens do Firebase
2. Fazer upload para o Cloudinary
3. Atualizar os registros no banco de dados com as novas URLs

## Troubleshooting

### Erro de Credenciais
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o API Secret não foi exposto publicamente

### Erro de Upload
- Verifique o tamanho do arquivo (limite padrão: 10MB)
- Confirme se o formato da imagem é suportado

### URLs Quebradas
- Verifique se o public_id está correto
- Confirme se a imagem não foi deletada do Cloudinary

## Recursos Adicionais

- [Documentação do Cloudinary](https://cloudinary.com/documentation)
- [Transformações de Imagem](https://cloudinary.com/documentation/image_transformations)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
