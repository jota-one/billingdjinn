<template>
  <div class="drawer lg:drawer-open h-full">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <aside class="drawer-side">
      <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu bg-base-200 text-base-content min-h-full w-60 p-4">
        <li>
          <RouterLink to="/" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa6-solid-house text-xl"></span>
            Accueil
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/clients" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-users text-xl"></span>
            Clients
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/invoices" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-file-invoice-dollar text-xl"></span>
            Factures
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/ledger" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-book text-xl"></span>
            Grand Livre
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/ledger/bulk" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-calendar-plus text-xl"></span>
            Saisie en série
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/transitoires" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa6-solid-arrows-left-right text-xl"></span>
            Transitoires
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/stats" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-chart-pie text-xl"></span>
            Statistiques
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/users" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-users text-xl"></span>
            Utilisateurs
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings" class="flex items-center gap-3" active-class="menu-active">
            <span class="i-fa-solid-building text-xl"></span>
            Mon entreprise
          </RouterLink>
        </li>
        <li>
          <div class="flex items-center gap-3 cursor-pointer" @click="goOut">
            <span class="i-fa-solid-sign-out-alt text-xl"></span>
            Retour au site
          </div>
        </li>
      </ul>
    </aside>
    <div class="drawer-content p-4 overflow-y-auto h-[calc(100vh-5rem)]">
      <label for="my-drawer" class="drawer-button cursor-pointer lg:hidden">
        <span class="i-fa-solid-bars text-xl"></span>
      </label>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const goOut = () => {
  window.location.href = '/'
}
</script>
