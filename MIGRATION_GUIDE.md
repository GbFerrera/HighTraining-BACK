# 🚀 Guia de Migração para TypeScript + Swagger

## ✅ O que já foi migrado

### Configuração Base
- ✅ `tsconfig.json` - Configuração TypeScript
- ✅ `package.json` - Scripts atualizados
- ✅ `src/@types/express.d.ts` - Tipos customizados do Express
- ✅ `src/types/index.ts` - Todos os tipos e DTOs

### Utils e Services
- ✅ `src/utils/AppError.ts`
- ✅ `src/utils/validateCPF.ts`
- ✅ `src/services/AsaasService.ts`

### Middlewares e Configs
- ✅ `src/middlewares/ensureAuthenticated.ts`
- ✅ `src/configs/auth.ts`
- ✅ `src/configs/swagger.ts`

### Controllers (com Swagger)
- ✅ `src/controllers/ClientesController.ts` - **Totalmente documentado**

### Routes
- ✅ `src/routes/clientes.routes.ts`
- ✅ `src/routes/index.ts`

### Database
- ✅ `src/database/knex/index.ts`

### Server
- ✅ `src/server.ts` - **Com Swagger UI integrado**

## 📋 Próximos Passos

### Controllers a migrar (copiar padrão de ClientesController.ts):
- [ ] `AdminsController.js` → `AdminsController.ts`
- [ ] `TreinadoresController.js` → `TreinadoresController.ts`
- [ ] `TrainingsController.js` → `TrainingsController.ts`
- [ ] `ExercisesController.js` → `ExercisesController.ts`
- [ ] `ExerciseTrainingsController.js` → `ExerciseTrainingsController.ts`
- [ ] `ClientTrainingController.js` → `ClientTrainingController.ts`
- [ ] `ClienteEstatisticController.js` → `ClienteEstatisticController.ts`
- [ ] `AgendaPointController.js` → `AgendaPointController.ts`

### Routes a migrar:
- [ ] `admins.routes.js` → `admins.routes.ts`
- [ ] `treinadores.routes.js` → `treinadores.routes.ts`
- [ ] `trainings.routes.js` → `trainings.routes.ts`
- [ ] `exercises.routes.js` → `exercises.routes.ts`
- [ ] `exerciseTrainings.routes.js` → `exerciseTrainings.routes.ts`
- [ ] `clientTraining.routes.js` → `clientTraining.routes.ts`
- [ ] `clienteEstatistic.routes.js` → `clienteEstatistic.routes.ts`
- [ ] `agendaPoint.routes.js` → `agendaPoint.routes.ts`

## 🎯 Como Rodar

### Desenvolvimento (TypeScript)
```bash
npm run dev
```

### Build para Produção
```bash
npm run build
npm run prod
```

### Acessar Swagger
Após rodar o servidor, acesse:
```
http://localhost:3232/api-docs
```

## 📝 Padrão de Migração de Controllers

1. **Importar tipos corretos:**
```typescript
import { Request, Response } from 'express';
import { CreateXDTO, UpdateXDTO } from '../types';
```

2. **Adicionar tipagem nos métodos:**
```typescript
async create(req: Request, res: Response): Promise<Response> {
  const data = req.body as CreateXDTO;
  // ...
}
```

3. **Adicionar documentação Swagger:**
```typescript
/**
 * @swagger
 * /endpoint:
 *   post:
 *     summary: Descrição
 *     tags: [Tag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 */
```

## ⚠️ Notas Importantes

- Os arquivos `.js` antigos ainda existem e funcionam durante a migração
- O TypeScript está configurado com `allowJs: true` para permitir migração incremental
- Após migrar um arquivo, você pode deletar o `.js` correspondente
- Os erros de "arquivo duplicado" são normais durante a migração

## 🔧 Troubleshooting

### Erro: "Cannot find module"
Certifique-se de que instalou todas as dependências:
```bash
npm install
```

### Erro de tipos
Limpe o cache do TypeScript:
```bash
rm -rf dist
rm -rf node_modules/.cache
```

## 📚 Recursos

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Swagger/OpenAPI Spec](https://swagger.io/specification/)
- [Express + TypeScript](https://expressjs.com/en/guide/routing.html)
