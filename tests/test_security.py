import os
import tempfile
import unittest

from app.auth.routes import validar_senha
from app.routes import files


class CaminhoSeguroTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.base = os.path.join(self.tmpdir.name, "drive")
        self.outside = os.path.join(self.tmpdir.name, "outside")
        os.mkdir(self.base)
        os.mkdir(self.outside)
        self.old_pasta_base = files.PASTA_BASE
        files.PASTA_BASE = self.base

    def tearDown(self):
        files.PASTA_BASE = self.old_pasta_base
        self.tmpdir.cleanup()

    def test_permite_caminho_dentro_da_pasta_base(self):
        os.mkdir(os.path.join(self.base, "docs"))

        caminho = files.caminho_seguro("docs")

        self.assertEqual(caminho, os.path.realpath(os.path.join(self.base, "docs")))

    def test_bloqueia_path_traversal(self):
        caminho = files.caminho_seguro("../outside")

        self.assertIsNone(caminho)

    def test_bloqueia_symlink_para_fora_da_pasta_base(self):
        symlink_path = os.path.join(self.base, "link-fora")
        try:
            os.symlink(self.outside, symlink_path)
        except (AttributeError, NotImplementedError, OSError) as exc:
            self.skipTest(f"Symlink indisponivel neste ambiente: {exc}")

        caminho = files.caminho_seguro("link-fora")

        self.assertIsNone(caminho)


class UploadValidationTestCase(unittest.TestCase):
    def test_bloqueia_extensoes_perigosas(self):
        self.assertTrue(files.extensao_bloqueada("script.sh"))
        self.assertTrue(files.extensao_bloqueada("payload.PY"))
        self.assertTrue(files.extensao_bloqueada(".htaccess"))

    def test_permite_extensoes_comuns(self):
        self.assertFalse(files.extensao_bloqueada("foto.jpg"))
        self.assertFalse(files.extensao_bloqueada("documento.pdf"))


class SenhaForteTestCase(unittest.TestCase):
    def test_aceita_senha_forte(self):
        ok, motivo = validar_senha("SenhaMuitoForte!123")

        self.assertTrue(ok)
        self.assertEqual(motivo, "")

    def test_rejeita_senha_fraca(self):
        ok, motivo = validar_senha("abc123")

        self.assertFalse(ok)
        self.assertIn("12 caracteres", motivo)


if __name__ == "__main__":
    unittest.main()
