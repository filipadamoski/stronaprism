<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Pogoda</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>

<header class="naglowek1">
    <img src="słońce.png" alt="Słonecznie">
</header>

<header class="naglowek2">
    <h1>Pogoda w Europie</h1>
</header>

<main>
    <section class="lewa">
        <h2>Temperatury w lipcu</h2>
        <table>
            <tr>
                <th>Miasto</th>
                <th>Kraj</th>
                <th>Temperatura</th>
                <th>Pogoda</th>
            </tr>
            <?php
            $polaczenie = mysqli_connect("localhost", "root", "", "pogoda");
            if (!$polaczenie) {
                echo "<tr><td colspan='4'>Błąd połączenia z bazą danych</td></tr>";
            } else {
                $zapytanie = "SELECT miejscowosc.nazwa, miejscowosc.kraj, pomiary.temperatura 
                              FROM miejscowosc 
                              JOIN pomiary ON miejscowosc.id = pomiary.id_miejscowosc 
                              WHERE pomiary.id_miesiac = 7";
                $wynik = mysqli_query($polaczenie, $zapytanie);
                if ($wynik) {
                    while ($wiersz = mysqli_fetch_row($wynik)) {
                        $temperatura = $wiersz[2];
                        if ($temperatura > 30) {
                            $obraz = "słońce.png";
                        } elseif ($temperatura < 26) {
                            $obraz = "deszcz.png";
                        } else {
                            $obraz = "słońcechmura.png";
                        }
                        echo "<tr>";
                        echo "<td>" . $wiersz[0] . "</td>";
                        echo "<td>" . $wiersz[1] . "</td>";
                        echo "<td>" . $wiersz[2] . "°C</td>";
                        echo "<td><img src='" . $obraz . "'></td>";
                        echo "</tr>";
                    }
                }
                mysqli_close($polaczenie);
            }
            ?>
        </table>
    </section>

    <section class="prawa">
        <h2>Średnie temperatury w roku</h2>
        <a href="index.php?id_miesiaca=1">Styczeń</a>
        <a href="index.php?id_miesiaca=2">Luty</a>
        <a href="index.php?id_miesiaca=3">Marzec</a>
        <a href="index.php?id_miesiaca=4">Kwiecień</a>
        <a href="index.php?id_miesiaca=5">Maj</a>
        <a href="index.php?id_miesiaca=6">Czerwiec</a>
        <a href="index.php?id_miesiaca=7">Lipiec</a>
        <a href="index.php?id_miesiaca=8">Sierpień</a>
        <a href="index.php?id_miesiaca=9">Wrzesień</a>
        <a href="index.php?id_miesiaca=10">Październik</a>
        <a href="index.php?id_miesiaca=11">Listopad</a>
        <a href="index.php?id_miesiaca=12">Grudzień</a>
        <p>Średnia temperatura dla wybranego miesiąca wynosi</p>
        <?php
        if (isset($_GET['id_miesiaca'])) {
            $id_miesiaca = $_GET['id_miesiaca'];
            $polaczenie2 = mysqli_connect("localhost", "root", "", "pogoda");
            if ($polaczenie2) {
                $zapytanie2 = "SELECT ROUND(AVG(temperatura), 2) AS srednia_temperatura 
                               FROM pomiary 
                               WHERE id_miesiac = " . $id_miesiaca;
                $wynik2 = mysqli_query($polaczenie2, $zapytanie2);
                if ($wynik2 && mysqli_num_rows($wynik2) > 0) {
                    $wiersz2 = mysqli_fetch_row($wynik2);
                    echo "<h3>" . $wiersz2[0] . " stopni</h3>";
                }
                mysqli_close($polaczenie2);
            }
        }
        ?>
    </section>
</main>

<footer>
    <p>Numer zdającego: 00000000</p>
</footer>

</body>
</html>
