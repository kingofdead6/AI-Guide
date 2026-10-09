import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../data/models.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/confetti.dart';
import '../widgets/python_runner.dart';
import '../widgets/rich_html.dart';
import '../widgets/ui.dart';

class ExercisesScreen extends StatefulWidget {
  final Course course;
  final Lesson lesson;
  const ExercisesScreen({super.key, required this.course, required this.lesson});

  @override
  State<ExercisesScreen> createState() => _ExercisesScreenState();
}

class _ExercisesScreenState extends State<ExercisesScreen> {
  final _runner = PythonRunner();
  List<Exercise>? _list;

  @override
  void initState() {
    super.initState();
    Content.I.exercises(widget.course.id).then((all) {
      if (mounted) setState(() => _list = all.where((e) => widget.lesson.exercises.contains(e.id)).toList());
    });
    // Start downloading Python right away; it takes a few seconds the first time.
    WidgetsBinding.instance.addPostFrameCallback((_) => _runner.warmUp().catchError((_) {}));
  }

  @override
  void dispose() {
    _runner.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Code exercises')),
      body: Stack(children: [
        PythonHost(_runner),
        if (_list == null)
          const Center(child: CircularProgressIndicator())
        else
          ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
            children: [
              Text(widget.lesson.title, style: t.titleLarge),
              const SizedBox(height: 4),
              Text('Write Python in the editor and run the hidden tests. Code runs on your phone with Pyodide.', style: t.bodyMedium?.copyWith(color: p.muted)),
              const SizedBox(height: 10),
              ListenableBuilder(
                listenable: _runner,
                builder: (_, _) => switch (_runner.state) {
                  RunnerState.loading => Row(children: [
                      const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                      const SizedBox(width: 8),
                      Text('Preparing Python…', style: t.bodySmall),
                    ]),
                  RunnerState.ready => Row(children: [Icon(Icons.check_circle_rounded, size: 16, color: p.ok), const SizedBox(width: 6), Text('Python is ready', style: t.bodySmall)]),
                  RunnerState.error => Text('Python could not load. It needs an internet connection the first time.', style: t.bodySmall?.copyWith(color: p.bad)),
                  RunnerState.idle => const SizedBox(),
                },
              ),
              const SizedBox(height: 16),
              for (var i = 0; i < _list!.length; i++)
                FadeIn(index: i, child: Padding(padding: const EdgeInsets.only(bottom: 18), child: _ExerciseCard(ex: _list![i], n: i + 1, runner: _runner))),
            ],
          ),
      ]),
    );
  }
}

class _ExerciseCard extends StatefulWidget {
  final Exercise ex;
  final int n;
  final PythonRunner runner;
  const _ExerciseCard({required this.ex, required this.n, required this.runner});

  @override
  State<_ExerciseCard> createState() => _ExerciseCardState();
}

class _ExerciseCardState extends State<_ExerciseCard> {
  late final TextEditingController _code;
  Timer? _save;
  RunResult? _result;
  bool _running = false;
  bool _solution = false;
  bool _output = false;

  @override
  void initState() {
    super.initState();
    final saved = ProgressStore.m(context.read<ProgressStore>().code[widget.ex.id])['code'] as String?;
    _code = TextEditingController(text: saved ?? widget.ex.starter);
    _code.addListener(() {
      _save?.cancel();
      _save = Timer(const Duration(milliseconds: 500), () {
        if (mounted) context.read<ProgressStore>().saveCode(widget.ex.id, _code.text);
      });
    });
  }

  @override
  void dispose() {
    _save?.cancel();
    _code.dispose();
    super.dispose();
  }

  void _insertTab() {
    final sel = _code.selection;
    final text = _code.text;
    final start = sel.start < 0 ? text.length : sel.start;
    final end = sel.end < 0 ? text.length : sel.end;
    _code.value = TextEditingValue(text: text.replaceRange(start, end, '    '), selection: TextSelection.collapsed(offset: start + 4));
  }

  Future<void> _run() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _running = true;
      _result = null;
    });
    final r = await widget.runner.run(_code.text, widget.ex.tests, widget.ex.packages);
    if (!mounted) return;
    setState(() {
      _running = false;
      _result = r;
    });
    if (r.ok) {
      final progress = context.read<ProgressStore>();
      final first = ProgressStore.m(progress.code[widget.ex.id])['passedAt'] == null;
      progress.codePassed(widget.ex.id);
      if (first) showConfetti(context, count: 120, origin: const Offset(0.5, 0.6));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final look = context.look;
    final ex = widget.ex;
    final solved = context.select<ProgressStore, bool>((s) => ProgressStore.m(s.code[ex.id])['passedAt'] != null);
    const codeColor = Color(0xFFE6EDF3);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          IconTile(Icons.code_rounded, color: p.course[3], size: 34),
          const SizedBox(width: 10),
          Expanded(child: Text('Exercise ${widget.n}: ${ex.title}', style: t.titleMedium)),
          if (solved) Pill('SOLVED', icon: Icons.check_rounded, color: p.ok, background: p.okSoft),
        ]),
        const SizedBox(height: 10),
        RichHtml(ex.prompt, serif: true, style: TextStyle(fontSize: 16 * look.readingScale, height: 1.5, color: p.text)),
        if (ex.packages.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text('Uses ${ex.packages.join(', ')} (downloaded on first run).', style: t.bodySmall)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: p.codeBg, borderRadius: BorderRadius.circular(14)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 6, 0),
              child: Row(children: [
                Text('solution.py', style: look.code(const TextStyle(color: Color(0xFF8B96A8), fontSize: 12))),
                const Spacer(),
                TextButton.icon(
                  onPressed: _insertTab,
                  style: TextButton.styleFrom(foregroundColor: const Color(0xFFC9D3E6), visualDensity: VisualDensity.compact),
                  icon: const Icon(Icons.keyboard_tab_rounded, size: 16),
                  label: const Text('Tab'),
                ),
              ]),
            ),
            TextField(
              controller: _code,
              maxLines: 18,
              minLines: 8,
              keyboardType: TextInputType.multiline,
              autocorrect: false,
              enableSuggestions: false,
              smartQuotesType: SmartQuotesType.disabled,
              smartDashesType: SmartDashesType.disabled,
              cursorColor: Colors.white,
              style: look.code(const TextStyle(color: codeColor, fontSize: 13.5, height: 1.5)),
              decoration: const InputDecoration(filled: false, border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none, contentPadding: EdgeInsets.fromLTRB(12, 4, 12, 12)),
            ),
          ]),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(
            child: ListenableBuilder(
              listenable: widget.runner,
              builder: (_, _) => GradientButton(
                label: _running ? (widget.runner.state == RunnerState.loading ? 'Loading Python…' : 'Running…') : 'Run tests',
                icon: Icons.play_arrow_rounded,
                busy: _running,
                expand: true,
                onPressed: _run,
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.outlined(tooltip: 'Reset to starter code', onPressed: () => _code.text = ex.starter, icon: const Icon(Icons.restart_alt_rounded)),
        ]),
        AnimatedSize(
          duration: look.d(300),
          curve: Curves.easeOutCubic,
          child: _result == null
              ? const SizedBox(width: double.infinity)
              : Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: _result!.ok ? p.okSoft : p.badSoft, borderRadius: BorderRadius.circular(12)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Icon(_result!.ok ? Icons.check_circle_rounded : Icons.cancel_rounded, color: _result!.ok ? p.ok : p.bad, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        switch (_result!) {
                          RunResult(ok: true) => 'All tests passed',
                          RunResult(stage: 'code') => 'Your code raised an error',
                          RunResult(stage: 'tests') => 'A test failed',
                          RunResult(stage: 'timeout') => 'Timed out',
                          _ => 'Could not run',
                        },
                        style: TextStyle(fontWeight: FontWeight.w800, color: _result!.ok ? p.ok : p.bad),
                      ),
                    ]),
                    if (_result!.error.isNotEmpty)
                      Padding(padding: const EdgeInsets.only(top: 8), child: SelectableText(_result!.error, style: look.code(TextStyle(fontSize: 12.5, color: p.text, height: 1.45)))),
                    if (_result!.output.isNotEmpty) ...[
                      TextButton(onPressed: () => setState(() => _output = !_output), child: Text(_output ? 'Hide printed output' : 'Show printed output')),
                      if (_output) SelectableText(_result!.output, style: look.code(TextStyle(fontSize: 12.5, color: p.text))),
                    ],
                  ]),
                ),
        ),
        const SizedBox(height: 4),
        TextButton(onPressed: () => setState(() => _solution = !_solution), child: Text(_solution ? 'Hide solution' : 'Show solution')),
        if (_solution) ...[
          Text('One possible solution. Try to finish your own version first.', style: t.bodySmall),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: p.codeBg, borderRadius: BorderRadius.circular(12)),
            child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: SelectableText(ex.solution, style: look.code(const TextStyle(color: codeColor, fontSize: 13, height: 1.5)))),
          ),
          Align(alignment: Alignment.centerLeft, child: TextButton(onPressed: () => _code.text = ex.solution, child: const Text('Load into editor'))),
        ],
      ]),
    );
  }
}
