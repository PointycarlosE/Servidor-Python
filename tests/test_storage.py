import os
import tempfile
import unittest

from app.storage.service import (
    StorageService, formatar_tamanho, _identificar_categoria, encurtar_caminho
)
import app.storage.service as storage_service_module


class StorageServiceTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.base = os.path.join(self.tmpdir.name, "drive")
        os.mkdir(self.base)
        self.old_pasta_base = storage_service_module.PASTA_BASE
        storage_service_module.PASTA_BASE = self.base
        StorageService.invalidate_cache()

    def tearDown(self):
        storage_service_module.PASTA_BASE = self.old_pasta_base
        StorageService.invalidate_cache()
        self.tmpdir.cleanup()

    def test_formatar_tamanho(self):
        self.assertEqual(formatar_tamanho(500), "500 B")
        self.assertEqual(formatar_tamanho(1024), "1.0 KB")
        self.assertEqual(formatar_tamanho(1024 * 1024 * 5), "5.0 MB")
        self.assertEqual(formatar_tamanho(1024 * 1024 * 1024 * 2), "2.00 GB")

    def test_identificar_categoria(self):
        self.assertEqual(_identificar_categoria("foto.png"), "imagens")
        self.assertEqual(_identificar_categoria("video.mp4"), "videos")
        self.assertEqual(_identificar_categoria("audio.mp3"), "audios")
        self.assertEqual(_identificar_categoria("documento.pdf"), "documentos")
        self.assertEqual(_identificar_categoria("arquivo.zip"), "compactados")
        self.assertEqual(_identificar_categoria("desconhecido.xyz"), "outros")

    def test_encurtar_caminho(self):
        self.assertEqual(encurtar_caminho("Raiz"), "Raiz")
        self.assertEqual(encurtar_caminho(""), "Raiz")
        self.assertEqual(encurtar_caminho("pasta/sub1"), "pasta/sub1")
        self.assertEqual(encurtar_caminho("a/b/c/d/e"), "a/b/c/d/e")
        self.assertEqual(encurtar_caminho("a/b/c/d/e/f/g"), "a/b/c/.../f/g")
        self.assertEqual(encurtar_caminho("fotos/viagem/2024/janeiro/praia/hotel/quarto"), "fotos/viagem/2024/.../hotel/quarto")

    def test_escanear_pasta_base_e_estatisticas(self):
        # Criar arquivos de teste
        with open(os.path.join(self.base, "foto.jpg"), "wb") as f:
            f.write(b"0" * 1024)  # 1 KB

        with open(os.path.join(self.base, "doc.pdf"), "wb") as f:
            f.write(b"0" * 2048)  # 2 KB

        subpasta = os.path.join(self.base, "subpasta")
        os.mkdir(subpasta)
        with open(os.path.join(subpasta, "musica.mp3"), "wb") as f:
            f.write(b"0" * 4096)  # 4 KB

        stats = StorageService.get_storage_stats(force_refresh=True)
        resumo = stats['resumo']

        self.assertEqual(resumo['total_arquivos'], 3)
        self.assertEqual(resumo['total_pastas'], 1)
        self.assertGreaterEqual(resumo['total_usado_bytes'], 1024 + 2048 + 4096)
        self.assertTrue(len(stats['maiores_arquivos']) == 3)
        # Maior arquivo deve ser a musica.mp3 (4096 bytes)
        self.assertEqual(stats['maiores_arquivos'][0]['nome'], "musica.mp3")

    def test_get_storage_summary(self):
        with open(os.path.join(self.base, "teste.txt"), "wb") as f:
            f.write(b"0" * 1024)

        summary = StorageService.get_storage_summary()
        self.assertIn('used_str', summary)
        self.assertIn('total_str', summary)
        self.assertIn('percent', summary)
        self.assertIn('text', summary)


if __name__ == '__main__':
    unittest.main()
