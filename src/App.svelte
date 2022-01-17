<script>
	import Sobre from './componetes/Sobre.svelte';
	import Emprestimo from './componetes/Emprestimo.svelte';
	
	let menu = 0;
</script>

<ul id="menu">
	<li class="menuu">
		<a href="/" on:click|preventDefault={() => (menu = 0)}>Hoje</a>
	</li>
	<li class="menuu">
		<a href="/" on:click|preventDefault={() => (menu = 1)}>Sobre</a>
	</li>
</ul>

	{#if menu === 0}
		<Emprestimo/>
	{:else if menu === 1}
		<Sobre/>
	{/if}


<style>
ul {
	
  list-style-type: none;
  overflow: hidden;
}
</style>
