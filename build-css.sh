#!/bin/bash

# Script para concatenar módulos CSS em um arquivo único

echo "🔨 Concatenando módulos CSS..."

# Criar arquivo principal concatenado
cat css/modules/variables.css > css/main.css
echo "" >> css/main.css
cat css/modules/reset.css >> css/main.css
echo "" >> css/main.css
cat css/modules/header.css >> css/main.css
echo "" >> css/main.css
cat css/modules/hero.css >> css/main.css
echo "" >> css/main.css
cat css/modules/cards.css >> css/main.css
echo "" >> css/main.css
cat css/modules/modals.css >> css/main.css
echo "" >> css/main.css
cat css/modules/glass-morphism.css >> css/main.css
echo "" >> css/main.css
cat css/modules/responsive.css >> css/main.css
echo "" >> css/main.css

echo "✅ CSS modularizado criado!"
