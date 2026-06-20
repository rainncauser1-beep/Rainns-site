import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Layout from "../components/Layout";
import { POSTS, formatDate } from "../data/blog-posts";

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export default function Blog() {
  return (
    <Layout>
      <section className="px-6 pt-24 pb-8 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="font-mono text-[10px] uppercase tracking-[0.22em] text-rain-600 mb-4">
            Koemori Blog
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl text-slate-900 tracking-tight leading-tight mb-4">
            Insights for <span className="italic text-rain-700">roofing contractors</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-slate-500 max-w-xl">
            Business growth, AI tools, and everything you need to stop losing jobs to a missed phone call.
          </motion.p>
        </motion.div>
      </section>

      <section className="px-6 pb-28 max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col gap-6"
        >
          {POSTS.map((post, i) => (
            <motion.article key={post.slug} variants={fadeUp}>
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="bg-cream-50 border border-slate-900/8 rounded-2xl p-8 hover:border-rain-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rain-600 bg-rain-50 border border-rain-200 px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-slate-400">
                      <Clock className="w-3 h-3" /> {post.readMins} min read
                    </span>
                    <span className="text-[12px] text-slate-400 ml-auto">
                      {formatDate(post.date)}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-3 group-hover:text-rain-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-rain-700 font-medium text-sm">
                    Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </Layout>
  );
}
