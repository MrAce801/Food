<template>
  <div class="content" ref="pdfcontent">
    <slot />
  </div>
</template>

<script>
import html2pdf from "html2pdf.js";

export default {
  name: "MyFood",
  methods: {
    async exportToPDF() {
      const element = this.$refs.pdfcontent;
      if (!element) return;

      const details = Array.from(element.querySelectorAll('details'));
      const prevStates = details.map(d => d.open);
      details.forEach(d => { d.open = true; });

      const opt = {
        margin: 0,
        filename: 'Foodplan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(element).set(opt).save();
      } finally {
        setTimeout(() => {
          details.forEach((d, i) => { d.open = prevStates[i]; });
        });
      }
    }
  }
};
</script>

<style scoped>
</style>
