function calculate(){
    //Pesquisa os elementos de entrada e saída no documento
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalinterest = document.getElementById("totalinterest");

    //Obtém entrada do usuário
    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12; //Coverte juros porcentagem para decimal e taxa anual para mensal
    var payments = parseFloat(years.value) * 12; //Converte pagamento em anos para mensal

    //Cálculo do valor mensal
    var x = Math.pow(1 + interest, payments); //Math.pow() calcula potências
    var monthly = (principal*x*interest) / (x-1);

    //Se o resultado é um número finito, a entrada estava correta e tem resultados para exibir
    if(isFinite(monthly)){
        //Preenche os campos de saída, arredondadno para 2 casa decimais
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

        //Salve entrada para que possa recuperar na próxima visita
        save(amount.value, apr.value, years.value, zipcode.value);

        //Anúncio: localiza e exibe finaceiras locais, mas ignora os erros de rede
        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        } catch (e) { /* E ignora esses erros */}

        //Traçar o gráfico do saldo devedor, dos juros e dos pagamentos do capital
        chart(principal, interest, monthly, payments);
    }
    else{
        //Resultado foi NaN ou infinito, significa entrada inválida ou incorreta.
        //Apaga qualquer saída exibida anteriormente
        //Apaga o conteúdo deste elemtnos
        payment.innerHTML = ""; 
        total.innerHTML = "";
        totalinterest = "";
        chart(); //Sem argumentos, apaga o gráfico
    }
}

//Salva a entrada do usuáruio como propriedades do objeto localStorage.
//Essas propriedades existirão quando o usúario visitar no futuro
function save(amount, apr, years, zipcode){
    if(window.localStorage){
        localStorage.loan_amout = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}

//Tenta restaura os campos de entrada automaticamente quando o documento é carregado pela primeira vez.
window.onload = function(){
    if(window.localStorage && localStorage.loan_amout){
        document.getElementById("amount").value = localStorage.loan_amout;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("years").value = localStorage.loan_years;
        document.getElementById("zipcode").value = localStorage.loan_zipcode;
    }
};

//Passa a entrada do usuário para um script no server side que (teoricamente),
//pode retornar uma lista de links para financeiras locais interessada em fazer empréstimos.
//Este exemplo não contém uma implementação real desse serviço.
//Mas se o serviço existisse, essa função funcionaria.
function getLenders(amount, apr, years, zipcode){
    //Se o navegador não suportar o objeto XMLHttpRequest, não faz nada
    if(!window.XMLHttpRequest)return;

    //Localiza o elemento para exibir a lista de financeiras
    var ad = document.getElementById("lenders");
    if(!ad) return; //Encerra se não há ponto de saída

    //Codifica a entrada do usuário como parâmetros de consulta em um URL
    var url = "getLenders.php" + //Url do serviço
    "?amt=" + encodeURIComponent(amount) + //Dados do usuário na string de consulta
    "&apr=" + encodeURIComponent(apr) + 
    "&yrs=" + encodeURIComponent(years) +
    "&zip=" + encodeURIComponent(zipcode);

    //Busca o conteúdo da URL usando o objeto XMLHttpRequest
    var req = new XMLHttpRequest(); //Inicia novo pedido
    req.open("GET", url) //Um pedido GET da HTTP para o url
    req.send(null); //Envia o pedido sem corpo

    //Antes de retornar, registra uma função de rotina de tratamento de evento
    //que será chamada posteriormente,quando a resposta do servidor HTTP chegar.
    req.onreadystatechange = function(){
        if(req.readyState == 4 && req.status == 200){
            //Se chegar aqui, obteve uma resposta HTTP válida e completa
            var response = req.responseText; //Resposta HTTP como string
            var lenders = JSON.parse(response); //Analisa em um array JS

            //Converte o array em uma string HTML
            var list = "";
            for(var i = 0; i < lenders.length; i++){
                list += "<li><a href='" + lenders[i].url + "'>" + lenders[i].name + "</a>"
            }

            //Exibe o código HTML no elemento acima
            ad.innerHTML = "<ul>" + list + "</ul>";
        }
    }
}

//Faz o gráfico do saldo devedor mensal, dos juros e do capital no elemento <canvas>
//Se for chamado sem argumentos, basta apagar qualquewr gráfico desenhado anteriormente.
function chart(principal, interest, monthly, payments){
    var graph = document.getElementById("graph"); //Obtém o <canvas>
    graph.width = graph.width; //Apagar e redefinir o elemento canvas

    //Se chamamos sem argumento/navegador nao suporta
    //basta retornar agora
    if(arguments.length == 0 || !graph.getContext) return;

    //Obtem o objeto "contexto" de <canvas> que define a API de desenho
    var g = graph.getContext("2d"); //Todo desenho é feito com esse objeto
    var width = graph.width, height = graph. height; //Obtem tamanho da tela de desenho

    //Essas funções convertem números de pagamento e valores monetário em pixels
    function paymentToX(n){
        return n * width/payments;
    }

    function amountToY(a){
        return height-(a * height/(monthly * payments * 1.05));
    }

    //Os pagamentos sao uma linha reta e (0,0) a (payments, monthly*payments)
    g.moveTo(paymentToX(0), amountToY(0)); //Começa no canto inferior esquerdo
    g.lineTo(paymentToX(payments), amountToY(monthly * payments)); //Desenha ate o canto superior direito
    g.lineTo(paymentToX(payments), amountToY(0)); //Para baixo até o canto inferior direito
    g.closePath(); //Volta ao inicio
    g.fillStyle = "#f88"; //Vermelho-claro
    g.fill(); //Preenche o triangulo
    g.font = "bold 12px sans-serif"; //Define uma fonte
    g.fillText("Total Interest Payments", 20,20); //Desenha texto na legenda

    //O capital acumulado nao é linear
    var equity = 0;
    g.beginPath(); //Inicia nova figura
    g.moveTo(paymentToX(0), amountToY(0)); //Começando no canto inferior esquerdo

    for(var p = 1; p <= payments; p++){
        //Para cada pagamento, descobre quanto é o juro
        var thisMonthsInterest = (principal - equity) * interest;
        equity += (monthly - thisMonthsInterest); //O resto vai para o capital
        g.lineTo(paymentToX(p), amountToY(equity)); //Linha até este ponto
    }

    g.lineTo(paymentToX(payments), amountToY(0)); //Linha de volta para o eixo X
    g.closePath(); //E volta para o ponto inical
    g.fillStyle = "green"; //Cor verde
    g.fill(); //Preenche a area sob a curva
    g.fillText("Total Equity", 20,35); //Rotula em verde

    //Faz o laço novamente, mas representa o saldo devedor com uma linha preta grossa no gráfico
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(bal));
    
    for(var p = 1; p < payments; p++){
        var thisMonthsInterest = bal * interest;
        bal -= (monthly - thisMonthsInterest); //O resto vai para o capital
        g.lineTo(paymentToX(p), amountToY(bal)); //Desenha até esse ponto
    }
    g.lineWidth = 3; //Usa linha grossa
    g.stroke(); //Desenha a curva do saldo
    g.fillStyle = "black"; //Troca para o texto preto
    g.fillText("Loan Balance", 20,50); //Entrada da legenda

    //Agora faz as marcações anuais e os números de ano no eixo X
    g.textAlign = "center" //Centraliza o texto nas marcass

    var y = amountToY(0); //Cordenada Y do eixo X
    for(var year = 1; year * 12 <= payments; year++){ //Para cada ano
        var x = paymentToX(year * 12); //Calcula a posição da marca
        g.fillRect(x - 0.5, y - 3,1,3) //Desenha a marca
        
        if(year == 1){
            g.fillText("Year", x, y - 5); //Rotula o eixo
        }
        if(year % 5 == 0 && year * 12 !== payments){ //Numera a cada 5 anos
            g.fillText(String(year), x, y - 5);
        }

        //marca valores de pagamento ao longo da margem direita
        g.textAlign = "right" //Alinha o texto a direita
        g.textBaseLine = "middle" //Centraliza verticalmente

        var ticks = [monthly * payments, principal] //Dois pontos que marcaremos
        var rightEdge = paymentToX(payments) //Coordenada X do eixo Y

        for(var i = 0; i < ticks.length; i++){ //Para cada um dos 2 pontos
            var y = amountToY(ticks[i]); //Calcula a posução Y da marca
            g.fillRect(rightEdge - 3, y - 0.5, 3,1); //Desenha a marcação
            g.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y); //E a rotula
        }
    }
}