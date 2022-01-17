<script>
    let valortotall = 0;
    let valormess = 0;
    let valor = null
    let mes = null
    let banco = ""
    let consignado = ""
    let correntista = ""

class Bancos {
   constructor (banco, juros){
   this.banco = banco;
   this.juros = juros;
}
}
const BancoBrasil = new Bancos("Brasil",[3.06,2.96,2.72,2.52])
const BancoCaixa = new Bancos("Caixa",[3.32,3.22,3.12,3.01])
const BancoItau = new Bancos("Itau",[3.72,3.63,3.56,3.42])

let valortotal = 0
let juros = 0
let valormes = 0

  function verificar() {

  if (banco == "brasil" && consignado == "Nao" && correntista == "Nao") {
    juros = (valor * BancoBrasil.juros[0] / 100) * mes;
    calculo()

  } else if (banco == "brasil" && consignado == "Sim" && correntista == "Nao") {
    juros = (valor * BancoBrasil.juros[1] / 100) * mes;
    calculo()

  } else if (banco == "brasil" && consignado == "Nao" && correntista == "Sim") {
    juros = ((valor * BancoBrasil.juros[2] / 100) * mes);
    calculo()

  } else if (banco == "brasil" && consignado == "Sim" && correntista == "Sim") {
    juros = ((valor * BancoBrasil.juros[3] / 100) * mes);
    calculo()

  // banco caixa
  }if (banco == "caixa" && consignado == "Nao" && correntista == "Nao") {
    juros = ((valor * BancoCaixa.juros[0] / 100) * mes);
    calculo()

  } else if (banco == "caixa" && consignado == "Sim" && correntista == "Nao") {
    juros = ((valor * BancoCaixa.juros[1] / 100) * mes);
    calculo()

  } else if (banco == "caixa" && consignado == "Nao" && correntista == "Sim") {
    juros = ((valor * BancoCaixa.juros[2] / 100) * mes);
    calculo()

  } else if (banco == "caixa" && consignado == "Sim" && correntista == "Sim") {
    juros = ((valor * BancoCaixa.juros[3] / 100) * mes);
    calculo()
  }
  // banco Itau
  if (banco == "itau" && consignado == "Nao" && correntista == "Nao") {
    juros = ((valor * BancoItau.juros[0] / 100) * mes);
    calculo()

  } else if (banco == "itau" && consignado == "Sim" && correntista == "Nao") {
    juros = ((valor * BancoItau.juros[1] / 100) * mes);
    calculo()

  } else if (banco == "itau" && consignado == "Nao" && correntista == "Sim") {
    juros = +((valor * BancoItau.juros[2] / 100) * mes);
 calculo()

  } else if (banco == "itau" && consignado == "Sim" && correntista == "Sim") {
    juros = ((valor * BancoItau.juros[3] / 100) * mes);
    calculo()
  }

  validar_campo()
  }

  function validar_campo (){
  if (valor == null) {
    alert("Infomar valor do emprestimo.")
  } else if (mes == null) {
    alert("Informar a quantidade de meses.")
  }
}

function calculo () {

    valortotal = (valor + juros);
    valormes = (valortotal / mes);
  

    valortotall = valortotal.toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL'
  })
  valormess = valormes.toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL'
  })
}

</script>

<body>
  <main class="principal">
    <div>
      <h1>Emprestimo Bancario</h1>
    </div>
      <div>
        <form action="/">
          <div class="emprestimoo">
            <label for="valor">Qual é o valor do emprestimo :</label>
            <input class="valor" type="number" bind:value={valor}>
          </div>
          <div class="emprestimoo">
            <label for="mes">Informe em quantos meses é o finaciamento :</label>
            <input class="mes" type="number" bind:value={mes}>
          </div>
        </form>
        <div class="emprestimoo">
          <form action="/">
            <label for="banco">Escolhar um banco :</label>
            <select  id="banco" bind:value={banco}>
              <option value="brasil">Banco do Brasil</option>
              <option value="caixa">Banco da Caixa</option>
              <option value="itau">Banco Itaú</option>
            </select>
          </form>
          <div class="emprestimoo">
            <form action="/">
              <label for="consignado">O emprestimo é consignado ?</label>
              <select name="consignado" id="consignado"  bind:value={consignado}>
                <option value="Sim">Sim</option>
                <option value="Nao">Não</option>
              </select>
            </form>
          </div>
          <div class="emprestimoo">
            <form action="/">
              <label for="correntista">Você é correntista do banco ?</label>
              <select name="correntista" id="correntista"  bind:value={correntista}>
                <option value="Sim">Sim</option>
                <option value="Nao">Não</option>
              </select>
            </form>
          </div>
        </div>
      </div>
    <div class="button">
      <button on:click={verificar}>Calcular</button>
    </div>
    <div>
      <p class=" valor">O valor a ser pago por mes é : {valormess}</p>
      <div>
        <p class="valor">O valor total é : {valortotall}</p>
      </div>
    </div>
  </main>
</body>

<style>
  .mes{
    width: 2cm;
  }

 .principal {
    width: 100%;
  }

 .emprestimoo{
  text-align: center;
  font-size: 20px;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;

}
h1{
  text-align: center;
}

.button{
 margin-top: 15px; 
  text-align: center;
  font-family:Arial, Helvetica, sans-serif;
}
button{
  font-size: 20px;
  font-family:Arial, Helvetica, sans-serif;
}

.valor{
  text-align: center;
  font-size: 20px;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
}
</style>
