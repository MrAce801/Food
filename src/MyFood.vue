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

      const clone = element.cloneNode(true);
      clone.querySelectorAll('details').forEach(d => { d.open = true; });

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = element.offsetWidth + 'px';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const opt = {
        margin: 0,
        filename: 'Foodplan.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(wrapper).set(opt).save();
      } finally {
        document.body.removeChild(wrapper);
      }
    }
  }
};
</script>

<style scoped>
</style>
