Ejecución aislada y limpia en Playwright:
Cada quien puede validar sus propios tests en su máquina local antes de subir cambios sin correr los de los demás

npx playwright test tests/barrera
npx playwright test tests/garcia
npx playwright test tests/lopez



1-> docker compose up -d
2-> docker exec -it pst-laravel-api-1 php artisan migrate:fresh --seed
2-> docker exec -it pst-laravel-api-1 php artisan key:generate
    docker exec -it pst-laravel-api-1 php artisan jwt:secret

    docker exec -u root -it pst-laravel-api-1 sh -c "chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache"

    docker exec -u root -it pst-laravel-api-1 sh -c "chmod -R 775 /var/www/storage /var/www/bootstrap/cache"


    docker run -it --rm --add-host localhost:host-gateway -p 9323:9323 -v "/$(pwd):/app" -w //app mcr.microsoft.com/playwright:v1.65.1-jammy bash


    npx playwright test
    npx playwright show-report --host 0.0.0.0 --port 9323

3-> docker compose exec laravel-api php artisan migrate:fresh --seed

    
admin@practicesoftwaretesting.com
welcome01
INV-20260000024