Ejecución aislada y limpia en Playwright:
Cada quien puede validar sus propios tests en su máquina local antes de subir cambios sin correr los de los demás

npx playwright test tests/barrera
npx playwright test tests/garcia
npx playwright test tests/lopez



** 1-> docker compose up -d
** 2-> docker exec -it pst-laravel-api-1 php artisan migrate:fresh --seed
** 3-> docker compose exec laravel-api php artisan migrate:fresh --seed



// SI LES PIDE PERMISO DE ESCRITURA EN DIRECTORIOS SOBRE LOS STORAGE



**Generar la clave de encriptación de la aplicación Laravel
  -> docker exec -it pst-laravel-api-1 php artisan key:generate


**Generar la clave secreta para los tokens de sesión JWT:
  ->  docker exec -it pst-laravel-api-1 php artisan jwt:secret

**Limpiar la caché de configuración para aplicar las nuevas claves:
  ->  docker exec -it pst-laravel-api-1 php artisan config:clear

Asignar la propiedad al usuario del servidor web (www-data) ejecutando como root:
->  docker exec -u root -it pst-laravel-api-1 sh -c "chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache"

Asignar los permisos de escritura a las carpetas de almacenamiento y caché ejecutando como root:
->  docker exec -u root -it pst-laravel-api-1 sh -c "chmod -R 775 /var/www/storage /var/www/
