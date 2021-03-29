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

    
}