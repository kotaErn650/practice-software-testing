Ejecución aislada y limpia en Playwright:
Cada quien puede validar sus propios tests en su máquina local antes de subir cambios sin correr los de los demás

npx playwright test tests/barrera
npx playwright test tests/garcia
npx playwright test tests/lopez



1-> docker compose up -d
2-> docker exec -it pst-laravel-api-1 php artisan migrate:fresh --seed
3-> docker compose exec laravel-api php artisan migrate:fresh --seed
