# Política de Seguridad

## Reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto:

1. **No abras un Issue público** con los detalles de la vulnerabilidad.
2. Envía un correo a `andresfelipegrajales497@gmail.com`.
3. Incluye, si es posible:
   - Descripción de la vulnerabilidad.
   - Pasos para reproducirla.
   - Impacto potencial.
   - Evidencias o capturas relevantes.
4. Se procurará responder al reporte en un máximo de 48 horas.

## Prácticas de seguridad implementadas

Actualmente el proyecto implementa las siguientes medidas:

- Las credenciales y variables sensibles se gestionan mediante variables de entorno.
- El archivo `.env` está excluido del repositorio mediante `.gitignore`.
- Se proporciona un `.env.example` sin credenciales reales para documentar la configuración requerida.
- Las claves de la API de Gemini no están escritas directamente en el código fuente.
- ESLint se utiliza para realizar análisis estático del código.
- Jest y Supertest se utilizan para pruebas automatizadas.
- GitHub Actions ejecuta automáticamente el lint y las pruebas en cada cambio relevante.
- `npm ci` se utiliza en el pipeline de CI para realizar instalaciones reproducibles a partir de `package-lock.json`.
- Las dependencias se revisan mediante `npm audit`.

## Manejo de credenciales

Nunca se deben incluir en el repositorio:

- Claves de API.
- Contraseñas.
- Tokens de autenticación.
- Secretos de producción.
- Archivos `.env` con valores reales.

Las variables sensibles deben configurarse mediante variables de entorno o mediante los mecanismos de secretos proporcionados por la plataforma de despliegue.

## Reportes de seguridad

Los reportes privados permiten investigar y corregir vulnerabilidades antes de divulgar públicamente información que pueda facilitar su explotación.