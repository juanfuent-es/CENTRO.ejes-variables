#!/bin/bash
# Define permisos de ejecución: chmod +x convert-font.sh
# Verifica la instalación de:
# - fonttools: python3 -m fontTools.ttLib.woff2 --help
# - pyftsubset: pyftsubset --help
# - fontTools.subset: python3 -m fontTools.subset --help
# - fontTools.ttLib.woff2: python3 -m fontTools.ttLib.woff2 --help
# Ejecutar con: ./convert-font.sh
echo "Convirtiendo DesgasteVF.ttf a DesgasteVF.woff2...";

# Método preferido: usar fontTools.ttLib.woff2 compress (compresión directa sin subset)
if python3 -c "import fontTools.ttLib.woff2" 2>/dev/null; then
    python3 -m fontTools.ttLib.woff2 compress ./css/DesgasteVF.ttf -o ./css/DesgasteVF.woff2
    if [ $? -eq 0 ]; then
        echo "✓ Conversión exitosa usando fontTools.ttLib.woff2"
        exit 0
    fi
fi

# Método alternativo: usar pyftsubset
if command -v pyftsubset &> /dev/null; then
    pyftsubset ./css/DesgasteVF.ttf --layout-features="*" --flavor="woff2" --output-file="./css/DesgasteVF.woff2"
    if [ $? -eq 0 ]; then
        echo "✓ Conversión exitosa usando pyftsubset"
        exit 0
    fi
fi

# Método alternativo: usar fontTools.subset
if python3 -m fontTools.subset --help &> /dev/null 2>&1; then
    python3 -m fontTools.subset ./css/DesgasteVF.ttf --layout-features="*" --flavor="woff2" --output-file="./css/DesgasteVF.woff2"
    if [ $? -eq 0 ]; then
        echo "✓ Conversión exitosa usando fontTools.subset"
        exit 0
    fi
fi

echo "Error: No se pudo convertir la fuente."
echo "Para instalar fonttools, ejecuta uno de estos comandos:"
echo "  sudo apt install python3-fonttools"
echo "  O: python3 -m pip install --user fonttools --break-system-packages"
exit 1