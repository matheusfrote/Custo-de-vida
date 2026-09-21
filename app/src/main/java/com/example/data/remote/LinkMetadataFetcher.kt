package com.example.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

data class ExtractedProductInfo(
    val title: String?,
    val price: Double?,
    val imageUrl: String?,
    val storeName: String?,
    val sourceUrl: String
)

object LinkMetadataFetcher {
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    suspend fun extract(url: String): ExtractedProductInfo? = withContext(Dispatchers.IO) {
        try {
            val formattedUrl = if (!url.startsWith("http://") && !url.startsWith("https://")) {
                "https://$url"
            } else {
                url
            }

            val request = Request.Builder()
                .url(formattedUrl)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null

                val title = findMeta(body, "og:title")
                    ?: findMeta(body, "twitter:title")
                    ?: extractTag(body, "title")

                val image = findMeta(body, "og:image")
                    ?: findMeta(body, "twitter:image")

                val siteName = findMeta(body, "og:site_name")
                    ?: detectStoreFromUrl(formattedUrl)

                val priceMeta = findMeta(body, "product:price:amount")
                    ?: findMeta(body, "og:price:amount")
                val priceFromMeta = priceMeta?.replace(",", ".")?.toDoubleOrNull()

                val priceAmount = priceFromMeta
                    ?: extractJsonLdPrice(body)
                    ?: extractRegexPrice(body)

                ExtractedProductInfo(
                    title = cleanText(title),
                    price = priceAmount,
                    imageUrl = image,
                    storeName = siteName,
                    sourceUrl = formattedUrl
                )
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun findMeta(html: String, propertyOrName: String): String? {
        val pattern = Pattern.compile(
            """<meta\s+[^>]*(?:property|name)=["']$propertyOrName["'][^>]*content=["']([^"']+)["']""",
            Pattern.CASE_INSENSITIVE
        )
        val matcher = pattern.matcher(html)
        if (matcher.find()) return matcher.group(1)

        val patternAlt = Pattern.compile(
            """<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']$propertyOrName["']""",
            Pattern.CASE_INSENSITIVE
        )
        val matcherAlt = patternAlt.matcher(html)
        if (matcherAlt.find()) return matcherAlt.group(1)

        return null
    }

    private fun extractTag(html: String, tag: String): String? {
        val pattern = Pattern.compile("""<$tag[^>]*>(.*?)</$tag>""", Pattern.CASE_INSENSITIVE or Pattern.DOTALL)
        val matcher = pattern.matcher(html)
        return if (matcher.find()) matcher.group(1)?.trim() else null
    }

    private fun extractJsonLdPrice(html: String): Double? {
        val pattern = Pattern.compile(""""price"\s*:\s*["']?([\d.,]+)["']?""", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(html)
        if (matcher.find()) {
            val raw = matcher.group(1)?.replace(",", ".") ?: return null
            return raw.toDoubleOrNull()
        }
        return null
    }

    private fun extractRegexPrice(html: String): Double? {
        val pattern = Pattern.compile("""R\$\s*([\d.]+,\d{2})""")
        val matcher = pattern.matcher(html)
        if (matcher.find()) {
            val raw = matcher.group(1)?.replace(".", "")?.replace(",", ".") ?: return null
            return raw.toDoubleOrNull()
        }
        return null
    }

    private fun detectStoreFromUrl(url: String): String {
        val lower = url.lowercase()
        return when {
            "amazon." in lower -> "Amazon"
            "mercadolivre." in lower -> "Mercado Livre"
            "magazineluiza." in lower || "magalu." in lower -> "Magazine Luiza"
            "kabum." in lower -> "KaBuM!"
            "casasbahia." in lower -> "Casas Bahia"
            "shopee." in lower -> "Shopee"
            "aliexpress." in lower -> "AliExpress"
            else -> "Loja Online"
        }
    }

    private fun cleanText(text: String?): String? {
        if (text == null) return null
        return text.replace("&quot;", "\"")
            .replace("&amp;", "&")
            .replace("&#39;", "'")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .trim()
    }
}
