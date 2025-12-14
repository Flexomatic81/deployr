#!/bin/bash

# Script zum Entfernen einer bestehenden Nginx-Installation auf dem Host
# WICHTIG: Nur ausführen, wenn Nginx nicht mehr benötigt wird!

set -e

echo "════════════════════════════════════════════"
echo "Nginx Host-Installation entfernen"
echo "════════════════════════════════════════════"
echo ""
echo "WARNUNG: Dieses Script entfernt Nginx komplett vom Host-System!"
echo "Dies ist sicher, da unser Docker-Setup eigene Nginx-Container verwendet."
echo ""
read -p "Möchtest Du fortfahren? (ja/nein): " confirm

if [ "$confirm" != "ja" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "[1/6] Prüfe ob Nginx installiert ist..."

if ! command -v nginx &> /dev/null; then
    echo "✓ Nginx ist nicht installiert (gut!)"
    echo ""
    echo "Prüfe trotzdem Port 80 und 443..."
    netstat -tulpn | grep -E ':(80|443) ' || echo "✓ Ports 80 und 443 sind frei"
    exit 0
fi

echo "✓ Nginx gefunden, wird entfernt..."
echo ""

# Nginx Version anzeigen
echo "Installierte Version:"
nginx -v 2>&1 || true
echo ""

# Nginx stoppen
echo "[2/6] Stoppe Nginx Service..."
systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
echo "✓ Nginx gestoppt"
echo ""

# Nginx deinstallieren
echo "[3/6] Deinstalliere Nginx-Pakete..."
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    apt-get purge -y nginx nginx-common nginx-core nginx-full 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum remove -y nginx 2>/dev/null || true
fi
echo "✓ Pakete deinstalliert"
echo ""

# Konfigurationsdateien entfernen
echo "[4/6] Entferne Konfigurationsdateien..."
rm -rf /etc/nginx
rm -rf /var/log/nginx
rm -rf /var/lib/nginx
rm -rf /usr/share/nginx
echo "✓ Konfiguration entfernt"
echo ""

# Benutzer/Gruppe entfernen (optional)
echo "[5/6] Entferne nginx User/Gruppe..."
userdel nginx 2>/dev/null || true
groupdel nginx 2>/dev/null || true
echo "✓ User/Gruppe entfernt"
echo ""

# Port-Check
echo "[6/6] Überprüfe Ports..."
echo ""
if netstat -tulpn | grep -E ':(80|443) '; then
    echo "⚠ WARNUNG: Port 80 oder 443 ist noch belegt!"
    echo "Prüfe welcher Prozess die Ports nutzt."
else
    echo "✓ Ports 80 und 443 sind frei"
fi
echo ""

echo "════════════════════════════════════════════"
echo "✓ Nginx erfolgreich entfernt!"
echo "════════════════════════════════════════════"
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. Überprüfe ob Docker und NPM laufen:"
echo "   docker ps"
echo ""
echo "2. Starte das Docker-Setup:"
echo "   ./quick-start.sh"
echo ""
echo "3. NPM sollte nun Port 80/443 nutzen können"
echo "   (falls NPM auf diesem Host läuft)"
echo ""
echo "════════════════════════════════════════════"
