import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'courses_screen.dart';
import 'explore_screen.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'progress_screen.dart';

/// The learner app: five tabs that keep their state while you switch between them.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  static void goTo(BuildContext context, int tab) => context.findAncestorStateOfType<_MainShellState>()?.setTab(tab);

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _tab = 0;

  void setTab(int i) => setState(() => _tab = i);

  @override
  Widget build(BuildContext context) {
    final pages = const [HomeScreen(), CoursesScreen(), ExploreScreen(), ProgressScreen(), ProfileScreen()];
    return Scaffold(
      body: AnimatedSwitcher(
        duration: context.look.d(260),
        switchInCurve: Curves.easeOutCubic,
        transitionBuilder: (child, a) => FadeTransition(
          opacity: a,
          child: SlideTransition(position: Tween(begin: const Offset(0, 0.015), end: Offset.zero).animate(a), child: child),
        ),
        child: KeyedSubtree(key: ValueKey(_tab), child: pages[_tab]),
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(border: Border(top: BorderSide(color: context.pal.border))),
        child: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: setTab,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.school_outlined), selectedIcon: Icon(Icons.school_rounded), label: 'Courses'),
            NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore_rounded), label: 'Explore'),
            NavigationDestination(icon: Icon(Icons.insights_outlined), selectedIcon: Icon(Icons.insights_rounded), label: 'Progress'),
            NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'Me'),
          ],
        ),
      ),
    );
  }
}
