import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { getPost, POSTS, formatDate } from "../data/blog-posts";

const EASE = [0.22, 1, 0.36, 1];

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPost(slug);

  useEffect(() => {
    if (!post) { navigate("/blog", { replace: true }); return; }
    // Update page title + meta for SEO
    document.title = `${post.title} | Koemori`;
    let meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", post.excerpt);
    window.scrollTo(0, 0);
  }, [post, navigate]);

  if (!post) return null;

  // Next/prev posts
  const idx = POSTS.findIndex((p) => p.slug === slug);
  const prev = POSTS[idx + 1] || null;
  const next = POSTS[idx - 1] || null;

  return (
    <Layout>
      {/* Hero */}
      <section className="px-6 pt-20 pb-10 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8">
            <ArrowLeft className="w-3.5 h-3.5" /> All posts
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rain-600 bg-rain-50 border border-rain-200 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-slate-400">
              <Clock className="w-3 h-3" /> {post.readMins} min read
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed mb-6">{post.excerpt}</p>
          <div className="text-[13px] text-slate-400 border-b border-slate-900/8 pb-8">
            Koemori · {formatDate(post.date)}
          </div>
        </motion.div>
      </section>

      {/* Body */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="prose prose-slate prose-lg max-w-none
            prose-headings:font-display prose-headings:tracking-tight prose-headings:text-slate-900
            prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-slate-900 prose-strong:font-semibold
            prose-ul:text-slate-600 prose-li:leading-relaxed
            prose-a:text-rain-700 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <div className="bg-rain-800 rounded-2xl p-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-300 mb-3">Ready to stop missing calls?</div>
          <h3 className="font-display text-3xl text-white tracking-tight mb-3">Try Koemori free</h3>
          <p className="text-rain-200 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
            Hear exactly how Koemori answers your calls. Takes 30 seconds.
          </p>
          <Link
            to="/get-started"
            className="inline-flex items-center gap-2 bg-cream-100 text-rain-800 px-6 py-3 rounded-full font-semibold hover:bg-white transition text-sm"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Prev / Next */}
      {(prev || next) && (
        <section className="px-6 pb-24 max-w-3xl mx-auto">
          <div className="border-t border-slate-900/8 pt-8 grid sm:grid-cols-2 gap-4">
            {prev && (
              <Link to={`/blog/${prev.slug}`} className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream-50 transition">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">← Previous</span>
                <span className="font-display text-lg text-slate-900 group-hover:text-rain-700 transition leading-tight">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link to={`/blog/${next.slug}`} className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream-50 transition text-right ml-auto w-full">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Next →</span>
                <span className="font-display text-lg text-slate-900 group-hover:text-rain-700 transition leading-tight">{next.title}</span>
              </Link>
            )}
          </div>
        </section>
      )}
    </Layout>
  );
}
