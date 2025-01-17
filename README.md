Mam Plan - Aplikacja do Zarządzania Wydarzeniami

Opis projektu

Mam Plan to aplikacja internetowa, która umożliwia użytkownikom planowanie wydarzeń i zarządzanie nimi w prosty sposób. Dzięki tej aplikacji możesz:

Tworzyć wydarzenia z tytułem, opisem, datą i czasem.

Określać czas trwania wydarzenia lub czas jego zakończenia.

Ustawiać powtarzanie wydarzeń (codziennie, co tydzień, co miesiąc itp.).

Generować pliki .ics do importu do kalendarzy.

Dodawać wydarzenia do Google Calendar za pomocą dynamicznego linku.

Udostępniać szczegóły wydarzenia za pomocą e-maila.

Ustawiać przypomnienia o wydarzeniach dzięki powiadomieniom przeglądarki.

Funkcjonalności

Tworzenie wydarzeń:

Wprowadź szczegóły wydarzenia: tytuł, opis, datę, godzinę rozpoczęcia, czas zakończenia lub czas trwania.

Opcjonalnie ustaw regułę powtarzania wydarzenia.

Powiadomienia o wydarzeniach:

Możliwość ustawienia przypomnienia w minutach przed wydarzeniem.

Powiadomienia działają w przeglądarce i przypominają o nadchodzącym wydarzeniu.

Generowanie plików .ics:

Pobierz wydarzenie w formacie .ics, które możesz zaimportować do większości aplikacji kalendarzowych.

Integracja z Google Calendar:

Dynamicznie generowany link umożliwiający dodanie wydarzenia do Google Calendar.

Udostępnianie za pomocą e-maila:

Wysyłaj szczegóły wydarzenia e-mailem do wybranych adresatów.

Instrukcja instalacji

Wymagania

Node.js (v16 lub nowszy)

NPM (v8 lub nowszy)

Kroki instalacji

Sklonuj repozytorium:

git clone https://github.com/danwlew/mamplan
cd mamplan

Zainstaluj zależności:

npm install

Uruchom aplikację w trybie deweloperskim:

npm run dev

Otwórz aplikację w przeglądarce:

http://localhost:3000

Skrypty NPM

npm run dev: Uruchamia aplikację w trybie deweloperskim.

npm run build: Buduje aplikację na potrzeby produkcji.

npm run lint: Sprawdza jakość kodu za pomocą ESLint.

Architektura kodu

src/ - Główny katalog aplikacji:

App.tsx - Główny komponent aplikacji.

components/ - Komponenty wielokrotnego użytku.

styles/ - Pliki CSS i konfiguracja TailwindCSS.

Technologie

React - Framework do budowy interfejsów użytkownika.

TypeScript - Statyczne typowanie dla większej niezawodności kodu.

Vite - Szybkie narzędzie do budowania aplikacji.

TailwindCSS - Utility-first framework do stylizacji.

ICS - Biblioteka do generowania plików kalendarza.

date-fns - Funkcje do operacji na datach.

Pomysły na rozwój

Obsługa wielu użytkowników:

Dodanie logowania i synchronizacji wydarzeń w chmurze.

Zaawansowane powiadomienia:

Wysyłanie powiadomień e-mailowych lub SMS-owych.

Customizacja wyglądu:

Dodanie możliwości personalizacji motywu aplikacji przez użytkownika.

Obsługa wielu języków:

Wdrożenie mechanizmu tłumaczeń (np. i18next).

Wkład w projekt

Zapraszamy do zgłaszania problemów oraz propozycji ulepszeń w sekcji Issues. Chętnie przyjmujemy pull requesty!

Licencja

Bierz i się dziel. Jak umiesz lepiej, to wspomnij ;)
